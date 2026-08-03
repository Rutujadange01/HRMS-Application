import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { CustomInput } from '../../components/CustomInput';
import { DatePickerInput } from '../../components/DatePickerInput';
import { TimePickerInput } from '../../components/TimePickerInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { Clock, PlusCircle, CheckCircle2, XCircle, ArrowLeft, Filter, AlertCircle, ShieldCheck, User, Calendar, FileText, Trash2, Edit2, Eye } from 'lucide-react-native';

export const MissPunchScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { missPunches = [], submitMissPunch, updateMissPunch, respondToMissPunch, deleteMissPunch } = useContext(HRMSContext);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [editingMissPunchId, setEditingMissPunchId] = useState(null);

  const openNewModal = () => {
    setEditingMissPunchId(null);
    setMissPunchDate(new Date().toISOString().split('T')[0]);
    setMissPunchType('In');
    setRequestedTime('09:00 AM');
    setReason('');
    setIsReadOnly(false);
    setFormRejectionReason('');
    setShowApplyModal(true);
  };

  const openEditModal = (item) => {
    const status = item.Status || item.status || 'Pending';
    setEditingMissPunchId(item.ID || item.id);
    setMissPunchDate(item.MissPunch_Date || new Date().toISOString().split('T')[0]);
    setMissPunchType(item.MissPunch_type || 'In');
    setRequestedTime(item.Requested_Time || '09:00 AM');
    setReason(item.Reason || '');
    setIsReadOnly(status === 'Rejected');
    setFormRejectionReason(item.Rejection_Reason || '');
    setShowApplyModal(true);
  };
  const [missPunchDate, setMissPunchDate] = useState(new Date().toISOString().split('T')[0]);
  const [missPunchType, setMissPunchType] = useState('In'); // In | Out | Both
  const [requestedTime, setRequestedTime] = useState('09:00 AM');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); // All | Pending | Approved | Rejected
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [formRejectionReason, setFormRejectionReason] = useState('');

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isAdminOrHR = userRole === 'Admin' || userRole === 'HR' || userRole === 'Manager';
  const isEmployee = userRole === 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();
  const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();

  // Filter requests for Employee vs Admin/HR
  const myRequests = isEmployee
    ? (missPunches || []).filter(mp => {
        const mpUid = (mp.UserID || mp.CreatedByUId || mp.employeeId || '').trim().toLowerCase();
        const mpName = (mp.CreatedByUName || mp.employeeName || '').trim().toLowerCase();
        return (profUid && mpUid === profUid) || (profName && mpName === profName);
      })
    : (missPunches || []);

  const filteredRequests = myRequests.filter(mp => {
    if (activeTab === 'All') return true;
    return (mp.Status || mp.status || 'Pending') === activeTab;
  });

  const handleSubmitRequest = async () => {
    if (!missPunchDate || !requestedTime || !reason) {
      Alert.alert('Validation Error', 'Missed punch date, requested time, and reason are required.');
      return;
    }

    setLoading(true);
    try {
      if (editingMissPunchId) {
        if (updateMissPunch) {
          await updateMissPunch(editingMissPunchId, {
            MissPunch_Date: missPunchDate,
            MissPunch_type: missPunchType,
            Requested_Time: requestedTime,
            Reason: reason
          });
          Alert.alert('Success', 'Miss Punch request updated.');
        }
      } else {
        const payload = {
          ID: 'mp_' + Date.now(),
          id: 'mp_' + Date.now(),
          CompanyID: profile?.companyId || 'comp_01',
          UserID: profile?.uid || profile?.UserID || 'emp_001',
          employeeId: profile?.uid || profile?.UserID || 'emp_001',
          CreatedByUName: profile?.name || profile?.FullName || 'Employee',
          employeeName: profile?.name || profile?.FullName || 'Employee',
          MissPunch_Date: missPunchDate,
          MissPunch_type: missPunchType,
          Requested_Time: requestedTime,
          Reason: reason,
          Status: 'Pending',
          Approved_By: '',
          Approved_Date: '',
          CreatedByUId: profile?.uid || profile?.UserID || 'emp_001',
          CreatedDate: new Date().toISOString(),
          UpdatedByUId: '',
          UpdatedByUName: '',
          UpdatedDate: ''
        };

        if (submitMissPunch) {
          await submitMissPunch(payload);
        }
        
        Alert.alert('Success', 'Miss Punch request submitted for approval.');
      }
      setReason('');
      setShowApplyModal(false);
    } catch (error) {
      Alert.alert('Error', `Failed to submit request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (mpItem) => {
    Alert.alert(
      "Approve Miss Punch",
      `Approve ${mpItem.MissPunch_type} punch correction for ${mpItem.CreatedByUName || mpItem.employeeName} on ${mpItem.MissPunch_Date}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve & Update Log",
          onPress: async () => {
            try {
              if (respondToMissPunch) {
                await respondToMissPunch(
                  mpItem.ID || mpItem.id,
                  'Approved',
                  profile?.name || profile?.FullName || 'Admin',
                  profile?.uid || profile?.UserID || 'admin_1'
                );
              }
              Alert.alert("Approved", "Miss Punch request approved and attendance log updated.");
            } catch (e) {
              Alert.alert("Error", e.message);
            }
          }
        }
      ]
    );
  };

  const handleReject = (mpItem) => {
    setRejectItem(mpItem);
    setRejectReason('');
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Error", "Please provide a rejection reason.");
      return;
    }
    try {
      if (respondToMissPunch) {
        await respondToMissPunch(
          rejectItem.ID || rejectItem.id,
          'Rejected',
          profile?.name || profile?.FullName || 'Admin',
          profile?.uid || profile?.UserID || 'admin_1',
          rejectReason.trim()
        );
      }
      Alert.alert("Rejected", "Miss Punch request rejected.");
      setRejectItem(null);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleCancelMyRequest = async (mpItem) => {
    try {
      if (deleteMissPunch) {
        await deleteMissPunch(mpItem.ID || mpItem.id);
      }
    } catch (e) {
      if (Platform.OS === 'web') window.alert("Error cancelling request.");
      else Alert.alert("Error", "Error cancelling request.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Actions */}
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle} numberOfLines={1}>Miss Punch Requests</Text>

        <TouchableOpacity style={styles.newRequestBtn} onPress={openNewModal}>
          <PlusCircle size={16} color="#ffffff" />
          <Text style={styles.newRequestText}>New Request</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Filter Bar */}
      <View style={styles.tabRow}>
        {['All', 'Pending', 'Approved', 'Rejected'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabChip, activeTab === t && styles.tabChipActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Request List Feed */}
      {filteredRequests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Clock size={36} color={COLORS.textSecondary} style={{ marginBottom: 8 }} />
          <Text style={styles.emptyTitle}>No Miss Punch Requests Found</Text>
          <Text style={styles.emptySub}>
            {activeTab === 'All' 
              ? "You don't have any missed punch requests. Tap '+ New Request' above if you forgot to clock in/out!"
              : `No requests with status '${activeTab}'.`}
          </Text>
        </View>
      ) : (
        filteredRequests.map((item) => {
          const status = item.Status || item.status || 'Pending';
          const isPending = status === 'Pending';
          const isApproved = status === 'Approved';
          const isRejected = status === 'Rejected';

          return (
            <View key={item.ID || item.id} style={styles.requestCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.headerLeft}>
                  <View style={[styles.typeBadge, item.MissPunch_type === 'In' ? styles.typeIn : styles.typeOut]}>
                    <Text style={styles.typeBadgeText}>Missed Punch {item.MissPunch_type || 'In'}</Text>
                  </View>

                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[
                    styles.statusBadge,
                    isApproved ? styles.statusApproved : isPending ? styles.statusPending : styles.statusRejected
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      isApproved ? styles.textApproved : isPending ? styles.textPending : styles.textRejected
                    ]}>
                      {status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Request Details */}
              <View style={styles.detailRow}>
                <Calendar size={15} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Missed Date:</Text>
                <Text style={styles.detailValue}>{item.MissPunch_Date}</Text>
              </View>

              <View style={styles.detailRow}>
                <Clock size={15} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Requested Time:</Text>
                <Text style={styles.detailValue}>{item.Requested_Time}</Text>
              </View>

              <View style={styles.reasonBox}>
                <FileText size={14} color={COLORS.textSecondary} style={{ marginTop: 2 }} />
                <Text style={styles.reasonText}>Reason: {item.Reason || 'No reason provided.'}</Text>
              </View>

              {/* Approver Audit Meta */}
              {!isPending && (
                <View style={[styles.auditMetaBox, isRejected && { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, padding: 8, borderRadius: 8 }]}>
                  <ShieldCheck size={14} color={isApproved ? COLORS.success : COLORS.danger} style={{ marginTop: isRejected ? 2 : 0 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.auditMetaText, isRejected && { color: COLORS.danger }]}>
                      {isApproved ? 'Approved' : 'Rejected'} by {item.Approved_By || item.UpdatedByUName || 'Admin'} on {isRejected ? (item.Rejecteddate || item.UpdatedDate || '').split('T')[0] : (item.Approved_Date ? item.Approved_Date.split('T')[0] : 'Today')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons for Admin/HR Approval */}
              {isAdminOrHR && isPending && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                    <CheckCircle2 size={16} color="#ffffff" />
                    <Text style={styles.approveBtnText}>Approve & Update Punch</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                    <XCircle size={16} color={COLORS.danger} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Employee Action Buttons (Edit/Delete) */}
              {isEmployee && (isPending || isRejected) && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <TouchableOpacity style={[{ padding: 8, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, marginRight: isPending ? 12 : 0 }]} onPress={() => openEditModal(item)}>
                    {isRejected ? <Eye size={16} color={COLORS.primary} /> : <Edit2 size={16} color={COLORS.primary} />}
                  </TouchableOpacity>
                  {isPending && (
                    <TouchableOpacity style={[{ padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }]} onPress={() => handleCancelMyRequest(item)}>
                      <Trash2 size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

            </View>
          );
        })
      )}

      {/* Reject Modal */}
      <Modal visible={!!rejectItem} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 }}>Reject Request</Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 }}>
                Provide a reason for rejecting this miss punch request.
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#f4f4f5',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  minHeight: 100,
                  textAlignVertical: 'top',
                  marginBottom: 20
                }}
                placeholder="Enter reason..."
                multiline
                value={rejectReason}
                onChangeText={setRejectReason}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <TouchableOpacity 
                  onPress={() => setRejectItem(null)}
                  style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={submitReject}
                  style={{ backgroundColor: COLORS.danger, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 15, color: '#fff', fontWeight: '600' }}>Reject Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Submit New Miss Punch Request Modal */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Missed Punch</Text>
                <Text style={styles.modalSub}>Submit punch correction for manager approval</Text>
              </View>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <XCircle size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View pointerEvents={isReadOnly ? 'none' : 'auto'}>
                {/* Date Input */}
                <DatePickerInput
                label="Date of Missed Punch"
                value={missPunchDate}
                onChangeText={setMissPunchDate}
              />

              {/* Punch Type Selector */}
              <Text style={styles.formLabel}>Missed Punch Type</Text>
              <View style={styles.typeSelectorRow}>
                {['In', 'Out', 'Both'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChipBtn, missPunchType === t && styles.typeChipBtnActive]}
                    onPress={() => {
                      setMissPunchType(t);
                      if (t === 'In') setRequestedTime('09:00 AM');
                      if (t === 'Out') setRequestedTime('06:00 PM');
                    }}
                  >
                    <Text style={[styles.typeChipBtnText, missPunchType === t && styles.typeChipBtnTextActive]}>
                      Missed {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Exact Time Selection */}
              <TimePickerInput
                label="Requested Punch Time"
                value={requestedTime}
                onChangeText={setRequestedTime}
              />

              <CustomInput
                label="Reason for Missed Punch"
                placeholder="Explain why punch was missed (e.g. Biometric scanner issue / On-field meeting)"
                value={reason}
                onChangeText={setReason}
                icon={FileText}
                multiline={true}
                numberOfLines={3}
                editable={!isReadOnly}
              />
              </View>

              {isReadOnly && formRejectionReason ? (
                <View style={{ marginTop: 16, backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <Text style={{ fontSize: 13, color: COLORS.danger, fontWeight: '600', marginBottom: 4 }}>Rejection Reason</Text>
                  <Text style={{ fontSize: 14, color: COLORS.danger, fontStyle: 'italic' }}>{formRejectionReason}</Text>
                </View>
              ) : null}

              {!isReadOnly && (
                <PrimaryButton
                  title="Submit Miss Punch Request"
                  onPress={handleSubmitRequest}
                  loading={loading}
                  icon={Clock}
                  style={{ marginTop: 12 }}
                />
              )}
            </ScrollView>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newRequestText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  requestCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeIn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  typeOut: {
    backgroundColor: 'rgba(253, 172, 100, 0.15)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  empNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textApproved: { color: COLORS.success },
  textPending: { color: COLORS.warning },
  textRejected: { color: COLORS.danger },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.inputBg,
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
  },
  auditMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  auditMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rejectBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  userActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  typeChipBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  typeChipBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeChipBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  timePresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
