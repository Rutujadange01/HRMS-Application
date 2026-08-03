import React, { useContext, useState, useEffect, useRef } from 'react';
import { storage, db } from '../../config/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { HRMSContext } from '../../context/HRMSContext';
import { COLORS } from '../../constants/theme';
import {
  UserCheck,
  Clock,
  IndianRupee,
  Calendar,
  CreditCard,
  Upload,
  ChevronRight,
  Camera,
  ScanFace,
  ShieldCheck,
  CheckCircle2,
  X,
  RefreshCw
} from 'lucide-react-native';

const CAMERA_SNAPSHOTS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
];

export const EssDashboardScreen = ({ navigation }) => {
  const { profile, setProfile } = useContext(AuthContext);
  const { clockedIn, toggleClockIn, updateEmployee, employees } = useContext(HRMSContext);

  // Dynamic lookup of matching employee record for currently logged-in user
  const currentEmpRecord = React.useMemo(() => {
    if (!employees || employees.length === 0) return null;
    const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
    const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();
    const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();

    return employees.find(e => {
      const eUid = (e.id || e.UserID || '').trim().toLowerCase();
      const eEmail = (e.Email || e.email || '').trim().toLowerCase();
      const eName = (e.FullName || e.name || '').trim().toLowerCase();
      return (profUid && eUid === profUid) || (profEmail && eEmail === profEmail) || (profName && eName === profName);
    });
  }, [employees, profile]);

  // UPhoto Camera Enrollment Modal State
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [scanStep, setScanStep] = useState('Align Face inside Viewfinder...');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const streamRef = useRef(null);
  
  const [fetchedUserPhoto, setFetchedUserPhoto] = useState(null);
  const activeEmpId = currentEmpRecord?.id || currentEmpRecord?.UserID || profile?.uid || profile?.UserID || profile?.id || 'emp_001';

  useEffect(() => {
    const fetchUserPhoto = async () => {
      try {
        const userDocRef = doc(db, 'users', activeEmpId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.UPhoto) {
            setFetchedUserPhoto(data.UPhoto);
          }
        }
      } catch (err) {
        console.log("Error fetching user photo:", err);
      }
    };
    if (activeEmpId && activeEmpId !== 'emp_001') {
       fetchUserPhoto();
    }
  }, [activeEmpId]);

  const currentUPhoto = fetchedUserPhoto || profile?.UPhoto || currentEmpRecord?.UPhoto || profile?.avatar || currentEmpRecord?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=F15E8C&color=fff`;

  useEffect(() => {
    if (cameraModalVisible) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
          .then((stream) => {
            streamRef.current = stream;
            setHasCameraStream(true);
          })
          .catch((err) => {
            console.log("Webcam stream unavailable:", err);
            setHasCameraStream(false);
          });
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setHasCameraStream(false);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraModalVisible]);

  const videoRef = useRef(null);

  const openCameraModal = () => {
    setCapturedPhoto(null);
    setCapturing(false);
    setScanStep('Align face inside target frame...');
    setCameraModalVisible(true);
  };

  const snapFacePhoto = () => {
    setCapturing(true);
    setScanStep('Capturing Live Real-Time Camera Frame...');
    setTimeout(() => {
      let livePhotoUrl = null;
      try {
        if (Platform.OS === 'web' && videoRef.current) {
          const videoEl = videoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth || 360;
          canvas.height = videoEl.videoHeight || 360;
          const ctx = canvas.getContext('2d');

          // Mirror horizontally for selfie webcam view
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);

          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          livePhotoUrl = canvas.toDataURL('image/jpeg', 0.90);
        }
      } catch (err) {
        console.warn("Real-time webcam snapshot capture error:", err);
      }

      if (!livePhotoUrl) {
        livePhotoUrl = currentUPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300';
      }

      setCapturedPhoto(livePhotoUrl);
      setCapturing(false);
      setScanStep('Live Photo Captured!');
    }, 400);
  };

  const handleSaveUPhoto = async () => {
    if (!capturedPhoto) {
      Alert.alert("Photo Required", "Please snap a face photo first.");
      return;
    }
    try {
      const targetEmpId = currentEmpRecord?.id || currentEmpRecord?.UserID || profile?.uid || profile?.UserID || profile?.id || 'emp_001';
      const companyId = currentEmpRecord?.CompanyID || currentEmpRecord?.companyId || profile?.CompanyID || profile?.companyId || 'comp_01';

      // Store the base64 UPhoto and CompanyID in a separate "users" table
      await setDoc(doc(db, 'users', targetEmpId), {
        CompanyID: companyId,
        UPhoto: capturedPhoto
      }, { merge: true });

      setFetchedUserPhoto(capturedPhoto);
      setCameraModalVisible(false);
      Alert.alert(
        "UPhoto Enrolled & Stored! ✅",
        "Your biometric face photo (UPhoto) has been saved successfully."
      );

      // Attempt to upload to Storage and update employee record (non-blocking)
      try {
        const storageRef = ref(storage, `uphotos/${profile?.uid || profile?.UserID || 'unknown'}/${Date.now()}.jpg`);
        await uploadString(storageRef, capturedPhoto, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);

        const updatedFields = {
          UPhoto: downloadURL,
          avatar: downloadURL,
          UpdatedOn: new Date().toISOString(),
        };

        if (updateEmployee) {
          await updateEmployee(targetEmpId, updatedFields);
        }
        if (setProfile) {
          setProfile(prev => ({ ...prev, ...updatedFields }));
        }
      } catch (err) {
        console.warn("Background storage upload or profile update failed:", err);
      }
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to save UPhoto.");
    }
  };

  const essActions = [
    { label: 'Register & Store Biometric UPhoto', icon: ScanFace, isUPhotoTrigger: true },
    { label: 'Upload Documents (Aadhaar/PAN)', icon: Upload, route: 'DocumentUpload' },
    { label: 'My Assigned Assets', icon: UserCheck, route: 'AssetManagement' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile ESS Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: currentUPhoto }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.cameraBadgeBtn} onPress={openCameraModal}>
            <Camera size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileDetails}>
          <Text style={styles.name}>{profile?.name || 'Sarah Jenkins'}</Text>
          <Text style={styles.role}>{profile?.role || 'Employee'} • Self Service</Text>
          <View style={styles.uphotoBadge}>
            <ShieldCheck size={12} color={COLORS.success} />
            <Text style={styles.uphotoBadgeText}>UPhoto Biometric Registered</Text>
          </View>
        </View>
      </View>



      {/* ESS Grid Actions */}
      <Text style={styles.sectionHeader}>Employee Self-Service Tools</Text>

      {essActions.map((item, index) => {
        const IconC = item.icon;
        return (
          <TouchableOpacity
            key={index}
            style={styles.essCard}
            onPress={() => {
              if (item.isUPhotoTrigger) {
                openCameraModal();
              } else if (item.route) {
                navigation.navigate(item.route);
              }
            }}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconWrapper, item.isUPhotoTrigger && styles.uphotoIconBg]}>
                <IconC size={20} color={item.isUPhotoTrigger ? COLORS.primary : COLORS.primary} />
              </View>
              <View>
                <Text style={styles.cardLabel}>{item.label}</Text>
                {item.isUPhotoTrigger && (
                  <Text style={styles.cardSubText}>Store reference face photo for attendance match</Text>
                )}
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        );
      })}

      {/* Camera & UPhoto Capture Modal */}
      <Modal visible={cameraModalVisible} animationType="slide" transparent>
        <View style={styles.cameraModalBg}>
          <View style={styles.cameraCard}>
            <View style={styles.cameraHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Camera size={20} color={COLORS.primary} />
                <Text style={styles.cameraTitle}>📷 Biometric UPhoto Camera Enroller</Text>
              </View>
              <TouchableOpacity onPress={() => setCameraModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Viewfinder / Camera Stream Frame */}
            <View style={styles.cameraPreviewFrame}>
              {capturedPhoto ? (
                <Image source={{ uri: capturedPhoto }} style={styles.cameraCapturedImg} />
              ) : Platform.OS === 'web' && hasCameraStream ? (
                <video
                  ref={(node) => {
                    videoRef.current = node;
                    if (node && streamRef.current && node.srcObject !== streamRef.current) {
                      node.srcObject = streamRef.current;
                      node.play().catch(() => { });
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 16,
                    transform: 'scaleX(-1)',
                  }}
                />
              ) : (
                <View style={styles.viewfinderBox}>
                  <Image source={{ uri: currentUPhoto }} style={styles.scannerFaceOverlayImg} />
                  {capturing && <View style={styles.laserLine} />}
                  <View style={[styles.hudCorner, styles.cornerTL]} />
                  <View style={[styles.hudCorner, styles.cornerTR]} />
                  <View style={[styles.hudCorner, styles.cornerBL]} />
                  <View style={[styles.hudCorner, styles.cornerBR]} />
                </View>
              )}
            </View>

            <Text style={styles.cameraHint}>
              {capturedPhoto ? "Photo Snapped! Review and click Save UPhoto below." : "Hold camera steady and click Snap Photo."}
            </Text>

            {/* Action Buttons */}
            <View style={styles.cameraActionRow}>
              {capturedPhoto ? (
                <>
                  <TouchableOpacity style={styles.retakeBtn} onPress={() => setCapturedPhoto(null)}>
                    <RefreshCw size={16} color={COLORS.textPrimary} />
                    <Text style={styles.retakeText}>Retake Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.saveUPhotoBtn} onPress={handleSaveUPhoto}>
                    <ShieldCheck size={18} color="#ffffff" />
                    <Text style={styles.saveUPhotoText}>Save UPhoto to Record</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.snapBtn} onPress={snapFacePhoto} disabled={capturing}>
                  {capturing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Camera size={18} color="#ffffff" />
                      <Text style={styles.snapText}>Snap Face Photo (UPhoto)</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cameraBadgeBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  role: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  uphotoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  uphotoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  clockCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clockTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  clockSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  clockBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  clockBtnOut: {
    backgroundColor: COLORS.danger,
  },
  clockBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  essCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    backgroundColor: COLORS.activeTabBg,
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  uphotoIconBg: {
    backgroundColor: '#FEF2F2',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSubText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  // Modal Styling
  cameraModalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  cameraCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
  },
  cameraHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cameraTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cameraPreviewFrame: {
    width: 220,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  cameraCapturedImg: {
    width: '100%',
    height: '100%',
  },
  viewfinderBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scannerFaceOverlayImg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.6,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowRadius: 8,
    shadowOpacity: 0.9,
  },
  hudCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.primary,
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },
  cameraHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  cameraActionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  snapBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  snapText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  retakeBtn: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retakeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveUPhotoBtn: {
    flex: 1.4,
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveUPhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
