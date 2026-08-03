import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { documentService } from '../../services/documentService';
import { COLORS } from '../../constants/theme';
import { Upload, CheckCircle2, XCircle, FileText, Trash2, ImageIcon } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

const REQUIRED_DOCS = [
  { id: 'aadhaar', label: 'Aadhaar Card', docEntry: 'Aadhaar', icon: FileText },
  { id: 'pan', label: 'PAN Card', docEntry: 'PAN', icon: FileText },
  { id: 'bank', label: 'Bank Passbook', docEntry: 'BankPassbook', icon: FileText }
];

export const DocumentUploadScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [localFiles, setLocalFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = profile?.uid || profile?.UserID || profile?.id;
  if (!userId) {
    Alert.alert('Error', 'User not logged in. Cannot upload documents.');
    return;
  }
  const userName = profile?.name || profile?.FullName || 'Sarah Jenkins';

  useEffect(() => {
    const unsub = documentService.subscribeUserAttachments(userId, (data) => {
      setDocuments(data);
    });
    return () => unsub();
  }, [userId]);

  const handlePickDocument = async (docId) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setLocalFiles(prev => ({ ...prev, [docId]: file }));
      }
    } catch (err) {
      console.warn("Failed to pick document", err);
    }
  };

  const handleDelete = (docId, imageUri) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await documentService.deleteAttachment(docId, imageUri);
            } catch (e) {
              Alert.alert("Error", e.message);
            }
          }
        }
      ]
    );
  };

  const handleSubmitAll = async () => {
    const typesToUpload = Object.keys(localFiles);

    if (typesToUpload.length === 0) {
      Alert.alert('No files selected', 'Please select at least one image to upload.');
      return;
    }

    setIsSubmitting(true);
    try {

      for (const docId of typesToUpload) {
        const file = localFiles[docId];
        const docDef = REQUIRED_DOCS.find(d => d.id === docId);

        // Web CORS Bypass: Use base64 directly in Firestore if on Web
        let uploadedUrl = file.uri;
        if (Platform.OS === 'web') {
          if (file.base64) {
            uploadedUrl = file.base64.startsWith('data:') ? file.base64 : `data:${file.mimeType || 'image/jpeg'};base64,${file.base64}`;
          } else {
            const response = await fetch(file.uri);
            const blob = await response.blob();
            uploadedUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } else {
          // Native Platforms use Firebase Storage
          uploadedUrl = await documentService.uploadFile(file.uri, file.name, userId);
        }

        // Build attachment object
        const newId = 'attach_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newDoc = {
          id: newId,
          AttachmentId: newId,
          CompanyID: profile?.companyId || profile?.CompanyID || 'comp_01',
          CreatedByUId: userId,
          CreatedByUName: userName,
          CreatedDate: new Date().toISOString(),
          DocEntry: docDef.docEntry,
          Image: uploadedUrl,
          UpdatedByUId: userId,
          UpdatedByUName: userName,
          UpdatedDate: new Date().toISOString(),
          UserID: userId,
        };
        await documentService.addAttachment(newDoc);
      }

      Alert.alert('Success', 'Documents submitted successfully!');
      setLocalFiles({}); // clear selections after success
    } catch (uploadErr) {
      console.error('Upload process failed:', uploadErr);
      Alert.alert('Upload Error', uploadErr.message || 'Failed to submit documents.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Upload size={24} color={COLORS.primary} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.title}>KYC Documents</Text>
            <Text style={styles.subtitle}>Upload your required identity proofs</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHint}>
          Please select clear images of the following documents. Once selected, click "Submit Documents" at the bottom to upload them.
        </Text>

        {REQUIRED_DOCS.map((docDef) => {
          const existingDoc = documents.find(d => d.DocEntry === docDef.docEntry);
          const localFile = localFiles[docDef.id];

          const hasImage = localFile || (existingDoc && existingDoc.Image && existingDoc.Image.trim() !== '');
          const previewUri = localFile ? localFile.uri : (existingDoc ? existingDoc.Image : null);

          const isSelected = !!localFile;
          const DocIcon = docDef.icon;

          return (
            <View key={docDef.id} style={[styles.card, existingDoc ? styles.cardSuccess : (isSelected ? styles.cardSelected : styles.cardPending)]}>
              <View style={styles.cardHeader}>
                <View style={styles.docInfo}>
                  <DocIcon size={24} color={existingDoc ? COLORS.success : (isSelected ? COLORS.primary : COLORS.textSecondary)} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.cardTitle}>{docDef.label}</Text>
                    {isSelected ? (
                      <Text style={styles.cardSubSelected}>Ready to Submit</Text>
                    ) : existingDoc ? (
                      <Text style={styles.cardSubSuccess}>Uploaded on {new Date(existingDoc.CreatedDate).toLocaleDateString()}</Text>
                    ) : (
                      <Text style={styles.cardSubPending}>Pending Upload</Text>
                    )}
                  </View>
                </View>
                {isSelected ? (
                  <CheckCircle2 size={24} color={COLORS.primary} />
                ) : existingDoc ? (
                  <CheckCircle2 size={24} color={COLORS.success} />
                ) : (
                  <XCircle size={24} color={COLORS.danger} />
                )}
              </View>

              {/* Image Preview */}
              {hasImage && previewUri && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
                </View>
              )}

              <View style={styles.actionArea}>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.btn, isSelected ? styles.btnOutlinePrimary : styles.btnOutline]}
                    onPress={() => handlePickDocument(docDef.id)}
                    disabled={isSubmitting}
                  >
                    <Upload size={16} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.btnOutlineText, isSelected && { color: COLORS.primary }]}>
                      {localFile ? 'Change Selection' : existingDoc ? 'Replace Image' : `Select Image`}
                    </Text>
                  </TouchableOpacity>

                  {existingDoc && !localFile && (
                    <TouchableOpacity
                      style={[styles.btn, styles.btnDanger]}
                      onPress={() => handleDelete(existingDoc.id || existingDoc.AttachmentId, existingDoc.Image)}
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {/* Global Submit Button */}
        <TouchableOpacity
          style={[styles.submitAllBtn, (Object.keys(localFiles).length === 0 || isSubmitting) && styles.submitAllBtnDisabled]}
          onPress={handleSubmitAll}
          disabled={Object.keys(localFiles).length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Upload size={20} color="#ffffff" />
          )}
          <Text style={styles.submitAllText}>
            {isSubmitting ? 'Uploading Documents...' : 'Submit Documents'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};
export default DocumentUploadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  sectionHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardPending: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffcfc',
  },
  cardSuccess: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f8fafc',
  },
  cardSelected: {
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSubPending: {
    fontSize: 13,
    color: COLORS.danger,
    marginTop: 4,
    fontWeight: '600',
  },
  cardSubSuccess: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
    fontWeight: '600',
  },
  cardSubSelected: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  previewContainer: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  actionArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  btnOutline: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnOutlinePrimary: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  btnOutlineText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  btnDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 16,
  },
  submitAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  submitAllBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitAllText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
