import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { CustomInput } from '../../components/CustomInput';
import { DatePickerInput } from '../../components/DatePickerInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { Clock, PlusCircle, CheckCircle2, XCircle, ArrowLeft, ShieldCheck, Calendar, FileText, ArrowRight, AlertTriangle } from 'lucide-react-native';

export const AttendanceCorrectionScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { 
    correctionRequests = [], 
    submitCorrectionRequest, 
    respondToCorrectionRequest, 
    deleteCorrectionRequest 
  } = useContext(HRMSContext);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [originalDate, setOriginalDate] = useState(new Date().toISOString().split('T')[0]);
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [correctionType, setCorrectionType] = useState('In'); // In | Out
  const [addedCheckIn, setAddedCheckIn] = useState('09:45 AM');
  const [addedCheckOut, setAddedCheckOut] = useState('06:00 PM');
  const [requestedCheckIn, setRequestedCheckIn] = useState('09:00 AM');
  const [requestedCheckOut, setRequestedCheckOut] = useState('06:00 PM');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); // All | Pending | Approved | Rejected

  // Rejection reason prompt modal state
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [selectedTargetItem, setSelectedTargetItem] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isAdminOrHR = userRole === 'Admin' || userRole === 'HR' || userRole === 'Manager';
  const isEmployee = userRole === 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();

  // Filter for employee vs admin
  const myRequests = isEmployee
    ? (correctionRequests || []).filter(cr => {
        const crUid = (cr.UserID || cr.CreatedByUId || cr.employeeId || '').trim().toLowerCase();
        const crName = (cr.CreatedByUName || cr.employeeName || '').trim().toLowerCase();
        return (profUid && crUid === profUid) || (profName && crName === profName);
      })
    : (correctionRequests || []);

  const filteredRequests = myRequests.filter(cr => {
    if (activeTab === 'All') return true;
    return (cr.Status || cr.status || 'Pending') === activeTab;
  });

  const handleSubmitRequest = async () => {
    if (!originalDate || !reason) {
      Alert.alert('Validation Error', 'Original date and reason are required.');
      return;
    }

    if (correctionType === 'In' && !requestedCheckIn) {
      Alert.alert('Validation Error', 'Requested Check-In time is required for IN correction.');
      return;
    }

    if (correctionType === 'Out' && !requestedCheckOut) {
      Alert.alert('Validation Error', 'Requested Check-Out time is required for OUT correction.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ID: 'ac_' + Date.now(),
        id: 'ac_' + Date.now(),
        CompanyID: profile?.companyId || 'comp_01',
        UserID: profile?.uid || profile?.UserID || 'emp_001',
        employeeId: profile?.uid || profile?.UserID || 'emp_001',
        CreatedByUName: profile?.name || profile?.FullName || 'Employee',
        employeeName: profile?.name || profile?.FullName || 'Employee',
        Original_Date: originalDate,
        Correction_Date: correctionDate || originalDate,
        correction_type: correctionType,
        Added_CheckIn: addedCheckIn || '--:--',
        Added_CheckOut: addedCheckOut || '--:--',
        Requested_CheckIn: requestedCheckIn,
        Requested_CheckOut: requestedCheckOut || '--:--',
        Reason: reason,
        Status: 'Pending',
        Approved_By: '',
        Approved_Date: '',
        Rejection_Reason: '',
        CreatedByUId: profile?.uid || profile?.UserID || 'emp_001',
        CreatedDate: new Date().toISOString(),
        UpdatedByUId: '',
        UpdatedByUName: '',
        UpdatedDate: ''
      };

      if (submitCorrectionRequest) {
        await submitCorrectionRequest(payload);
      }

      Alert.alert('Success', 'Attendance Correction request submitted for approval.');
      setReason('');
      setShowApplyModal(false);
    } catch (error) {
      Alert.alert('Error', `Failed to submit request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (crItem) => {
    Alert.alert(
      "Approve Correction",
      `Approve attendance correction for ${crItem.CreatedByUName || crItem.employeeName} on ${crItem.Correction_Date || crItem.Original_Date}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve & Update Attendance",
          onPress: async () => {
            try {
              if (respondToCorrectionRequest) {
                await respondToCorrectionRequest(
                  crItem.ID || crItem.id,
                  'Approved',
                  profile?.name || profile?.FullName || 'Admin',
                  profile?.uid || profile?.UserID || 'admin_1',
                  ''
                );
              }
              Alert.alert("Approved", "Attendance correction approved and punch record updated.");
            } catch (e) {
              Alert.alert("Error", e.message);
            }
          }
        }
      ]
    );
  };

  const openRejectModal = (crItem) => {
    setSelectedTargetItem(crItem);
    setRejectionReasonText('');
    setRejectionModalVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectionReasonText) {
      Alert.alert("Validation Error", "Please provide a rejection reason for the employee.");
      return;
    }

    try {
      if (respondToCorrectionRequest && selectedTargetItem) {
        await respondToCorrectionRequest(
          selectedTargetItem.ID || selectedTargetItem.id,
          'Rejected',
          profile?.name || profile?.FullName || 'Admin',
          profile?.uid || profile?.UserID || 'admin_1',
          rejectionReasonText
        );
      }
      setRejectionModalVisible(false);
      Alert.alert("Rejected", "Attendance Correction request rejected.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleCancelMyRequest = (crItem) => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this pending correction request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            if (deleteCorrectionRequest) {
              await deleteCorrectionRequest(crItem.ID || crItem.id);
            }
            Alert.alert("Cancelled", "Correction request cancelled.");
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Actions */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ArrowLeft size={20} color={COLORS.primary} />
        <Text style={styles.backText}>Back to Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.titleRow}>
        <Text style={styles.screenTitle} numberOfLines={1}>Attendance Correction Requests</Text>

        <TouchableOpacity style={styles.newRequestBtn} onPress={() => setShowApplyModal(true)}>
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
          <Text style={styles.emptyTitle}>No Correction Requests Found</Text>
          <Text style={styles.emptySub}>
            {activeTab === 'All' 
              ? "You don't have any attendance correction requests. Tap '+ New Request' above to request punch adjustments!"
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
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.correction_type || 'Time Correction'}</Text>
                  </View>
                  <Text style={styles.empNameText}>{item.CreatedByUName || item.employeeName || 'Employee'}</Text>
                </View>

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

              {/* Dates Row */}
              <View style={styles.dateComparisonRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Original Date</Text>
                  <Text style={styles.dateColVal}>{item.Original_Date}</Text>
                </View>
                <ArrowRight size={14} color={COLORS.textSecondary} />
                <View style={styles.dateCol}>
                  <Text style={styles.dateColLabel}>Target Correction Date</Text>
                  <Text style={styles.dateColVal}>{item.Correction_Date || item.Original_Date}</Text>
                </View>
              </View>

              {/* Punch Times Comparison Box */}
              <View style={styles.punchComparisonBox}>
                <View style={styles.punchCol}>
                  <Text style={styles.punchColHeader}>Recorded Punch</Text>
                  {(item.correction_type === 'In' || item.correction_type === 'Both' || !item.correction_type || item.correction_type === 'Time Correction' || item.correction_type === 'Shift Adjustment') && (
                    <Text style={styles.punchColText}>IN: <Text style={{ fontWeight: '700' }}>{item.Added_CheckIn || '--:--'}</Text></Text>
                  )}
                  {(item.correction_type === 'Out' || item.correction_type === 'Both' || item.correction_type === 'Forgot Out' || !item.correction_type || item.correction_type === 'Time Correction' || item.correction_type === 'Shift Adjustment') && (
                    <Text style={styles.punchColText}>OUT: <Text style={{ fontWeight: '700' }}>{item.Added_CheckOut || '--:--'}</Text></Text>
                  )}
                </View>

                <View style={styles.punchDivider} />

                <View style={styles.punchCol}>
                  <Text style={[styles.punchColHeader, { color: COLORS.primary }]}>Requested Punch</Text>
                  {(item.correction_type === 'In' || item.correction_type === 'Both' || !item.correction_type || item.correction_type === 'Time Correction' || item.correction_type === 'Shift Adjustment') && (
                    <Text style={styles.punchColText}>IN: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{item.Requested_CheckIn || '--:--'}</Text></Text>
                  )}
                  {(item.correction_type === 'Out' || item.correction_type === 'Both' || item.correction_type === 'Forgot Out' || !item.correction_type || item.correction_type === 'Time Correction' || item.correction_type === 'Shift Adjustment') && (
                    <Text style={styles.punchColText}>OUT: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{item.Requested_CheckOut || '--:--'}</Text></Text>
                  )}
                </View>
              </View>

              {/* Reason Box */}
              <View style={styles.reasonBox}>
                <FileText size={14} color={COLORS.textSecondary} style={{ marginTop: 2 }} />
                <Text style={styles.reasonText}>Reason: {item.Reason || 'No reason provided.'}</Text>
              </View>

              {/* Rejection Reason if Rejected */}
              {isRejected && item.Rejection_Reason && (
                <View style={styles.rejectionBox}>
                  <AlertTriangle size={14} color={COLORS.danger} style={{ marginTop: 1 }} />
                  <Text style={styles.rejectionText}>Rejection Remark: {item.Rejection_Reason}</Text>
                </View>
              )}

              {/* Approver Audit Meta */}
              {!isPending && (
                <View style={styles.auditMetaBox}>
                  <ShieldCheck size={14} color={isApproved ? COLORS.success : COLORS.danger} />
                  <Text style={styles.auditMetaText}>
                    {isApproved ? 'Approved' : 'Rejected'} by {item.Approved_By || item.UpdatedByUName || 'Admin'} on {item.Approved_Date ? item.Approved_Date.split('T')[0] : 'Today'}
                  </Text>
                </View>
              )}

              {/* Action Buttons for Admin/HR Approval */}
              {isAdminOrHR && isPending && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                    <CheckCircle2 size={16} color="#ffffff" />
                    <Text style={styles.approveBtnText}>Approve & Update</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.rejectBtn} onPress={() => openRejectModal(item)}>
                    <XCircle size={16} color={COLORS.danger} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Employee Cancel Action */}
              {isEmployee && isPending && (
                <TouchableOpacity style={styles.cancelLink} onPress={() => handleCancelMyRequest(item)}>
                  <Text style={styles.cancelLinkText}>Cancel My Request</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      {/* Submit New Correction Request Modal */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Attendance Correction</Text>
                <Text style={styles.modalSub}>Submit punch adjustments for manager review</Text>
              </View>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <XCircle size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Dates */}
              <DatePickerInput
                label="Original Date"
                value={originalDate}
                onChangeText={(val) => {
                  setOriginalDate(val);
                  if (!correctionDate) setCorrectionDate(val);
                }}
              />

              <DatePickerInput
                label="Target Correction Date"
                value={correctionDate}
                onChangeText={setCorrectionDate}
              />

              {/* Correction Type (In / Out) */}
              <Text style={styles.formLabel}>Correction Type</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                {['In', 'Out'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChipBtn, { flex: 1 }, correctionType === t && styles.typeChipBtnActive]}
                    onPress={() => {
                      setCorrectionType(t);
                      if (t === 'In') {
                        setRequestedCheckIn('09:00 AM');
                      } else if (t === 'Out') {
                        setRequestedCheckOut('06:00 PM');
                      }
                    }}
                  >
                    <Text style={[styles.typeChipBtnText, correctionType === t && styles.typeChipBtnTextActive]}>
                      {t === 'In' ? 'Correction IN' : 'Correction OUT'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Recorded Times (In or Out) */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {correctionType === 'In' && (
                  <View style={{ flex: 1 }}>
                    <CustomInput
                      label="Recorded Check-In"
                      placeholder="09:45 AM"
                      value={addedCheckIn}
                      onChangeText={setAddedCheckIn}
                      icon={Clock}
                    />
                  </View>
                )}

                {correctionType === 'Out' && (
                  <View style={{ flex: 1 }}>
                    <CustomInput
                      label="Recorded Check-Out"
                      placeholder="06:00 PM"
                      value={addedCheckOut}
                      onChangeText={setAddedCheckOut}
                      icon={Clock}
                    />
                  </View>
                )}
              </View>

              {/* Requested Times (In or Out) */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {correctionType === 'In' && (
                  <View style={{ flex: 1 }}>
                    <CustomInput
                      label="Requested Check-In *"
                      placeholder="09:00 AM"
                      value={requestedCheckIn}
                      onChangeText={setRequestedCheckIn}
                      icon={Clock}
                    />
                  </View>
                )}

                {correctionType === 'Out' && (
                  <View style={{ flex: 1 }}>
                    <CustomInput
                      label="Requested Check-Out *"
                      placeholder="06:00 PM"
                      value={requestedCheckOut}
                      onChangeText={setRequestedCheckOut}
                      icon={Clock}
                    />
                  </View>
                )}
              </View>

              <CustomInput
                label="Reason for Correction *"
                placeholder="Detailed reason for punch time discrepancy..."
                value={reason}
                onChangeText={setReason}
                icon={FileText}
                multiline={true}
                numberOfLines={3}
              />

              <PrimaryButton
                title="Submit Correction Request"
                onPress={handleSubmitRequest}
                loading={loading}
                icon={Clock}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Admin Rejection Reason Prompt Modal */}
      <Modal visible={rejectionModalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Request Remark</Text>
              <TouchableOpacity onPress={() => setRejectionModalVisible(false)}>
                <XCircle size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Rejection Reason"
              placeholder="Provide reason for rejecting this correction request..."
              value={rejectionReasonText}
              onChangeText={setRejectionReasonText}
              icon={FileText}
              multiline={true}
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity 
                style={[styles.typeChipBtn, { flex: 1 }]}
                onPress={() => setRejectionModalVisible(false)}
              >
                <Text style={styles.typeChipBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.approveBtn, { flex: 1, backgroundColor: COLORS.danger }]}
                onPress={confirmReject}
              >
                <XCircle size={16} color="#ffffff" />
                <Text style={styles.approveBtnText}>Confirm Rejection</Text>
              </TouchableOpacity>
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
    fontSize: 18,
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
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
    fontWeight: '700',
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
    backgroundColor: 'rgba(241, 94, 140, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
  statusApproved: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  statusRejected: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  textApproved: { color: COLORS.success },
  textPending: { color: COLORS.warning },
  textRejected: { color: COLORS.danger },

  dateComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  dateCol: {
    alignItems: 'flex-start',
  },
  dateColLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  dateColVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  punchComparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  punchCol: {
    flex: 1,
  },
  punchColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  punchColText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  punchDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.inputBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  rejectionText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
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
  cancelLink: {
    marginTop: 8,
    alignSelf: 'center',
  },
  cancelLinkText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
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
    maxWidth: 420,
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
    fontSize: 17,
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
  typeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  typeChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
    alignItems: 'center',
  },
  typeChipBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeChipBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
