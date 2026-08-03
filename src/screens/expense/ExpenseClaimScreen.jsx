import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { HRMSContext } from '../../context/HRMSContext';
import { CustomInput } from '../../components/CustomInput';
import { DatePickerInput } from '../../components/DatePickerInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { COLORS } from '../../constants/theme';
import {
  Receipt,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  FileText,
  Building2,
  Briefcase,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  UserCheck,
  CheckSquare,
  Square,
  AlertCircle,
  Trash2,
  Edit
} from 'lucide-react-native';

export const ExpenseClaimScreen = ({ navigation }) => {
  const { profile, user } = useContext(AuthContext);
  const { expenseClaims = [], submitExpenseClaim, respondToExpenseClaim, deleteExpenseClaim, updateExpenseClaim } = useContext(HRMSContext);

  const rawRole = (profile?.role || profile?.Role || 'Employee').toString().trim().toLowerCase();
  const isAdminOrHR = rawRole === 'admin' || rawRole === 'hr' || rawRole === 'manager';
  const activeUserId = profile?.uid || profile?.UserID || 'emp_001';
  const activeUserName = profile?.name || profile?.FullName || user?.displayName || 'Employee';

  const [activeTab, setActiveTab] = useState('All'); // All | Pending | Approved | Rejected
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [editingClaimId, setEditingClaimId] = useState(null);

  // Form Fields mapped strictly to SSMS Emp_ExpenseClaims
  const [expenseDesc, setExpenseDesc] = useState('');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');

  // Action states
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter Claims: Employees see their own claims; Admin/HR sees all claims
  const userClaims = isAdminOrHR
    ? expenseClaims
    : expenseClaims.filter(c => (c.UserID || c.CreatedByUId) === activeUserId);

  const filteredClaims = userClaims.filter(c => {
    if (activeTab === 'All') return true;
    return (c.Status || 'Pending').toLowerCase() === activeTab.toLowerCase();
  });

  // Calculate totals
  const totalApprovedAmount = userClaims
    .filter(c => c.Status === 'Approved')
    .reduce((sum, c) => sum + (parseFloat(c.Total_Amount) || 0), 0);

  const pendingCount = userClaims.filter(c => c.Status === 'Pending').length;

  const handleSubmitClaim = async () => {
    if (!expenseDesc.trim()) {
      Alert.alert("Validation Error", "Please enter Expense Description.");
      return;
    }
    if (!totalAmount || isNaN(totalAmount) || parseFloat(totalAmount) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid Total Amount.");
      return;
    }

    setLoading(true);
    try {
      if (editingClaimId) {
        await updateExpenseClaim(editingClaimId, {
          Expense_Desc: expenseDesc,
          Claim_Date: claimDate,
          Expense_Date: expenseDate,
          Description: description,
          Category: category,
          Total_Amount: totalAmount,
        });
        Alert.alert("Claim Updated!", "Your expense claim has been updated successfully.");
      } else {
        await submitExpenseClaim({
          UserID: activeUserId,
          CompanyID: profile?.companyId || 'comp_01',
          Expense_Desc: expenseDesc,
          Claim_Date: claimDate,
          Expense_Date: expenseDate,
          Description: description,
          Category: category,
          Total_Amount: totalAmount,
          CreatedByUId: activeUserId,
          CreatedByUName: activeUserName
        });
        Alert.alert("Claim Submitted!", "Your expense claim has been submitted for approval.");
      }

      setModalVisible(false);
      resetForm();
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to submit expense claim.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setExpenseDesc('');
    setTotalAmount('');
    setDescription('');
    setClaimDate(new Date().toISOString().split('T')[0]);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setEditingClaimId(null);
  };

  const handleEditClaim = (claim) => {
    setEditingClaimId(claim.ID || claim.id);
    setExpenseDesc(claim.Expense_Desc || '');
    setClaimDate(claim.Claim_Date || new Date().toISOString().split('T')[0]);
    setExpenseDate(claim.Expense_Date || new Date().toISOString().split('T')[0]);
    setCategory(claim.Category || '');
    setTotalAmount(claim.Total_Amount ? claim.Total_Amount.toString() : '');
    setDescription(claim.Description || '');
    setModalVisible(true);
  };

  const handleDeleteClaim = async (claimId) => {
    try {
      await deleteExpenseClaim(claimId);
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert("Error: Could not delete claim.");
      } else {
        Alert.alert("Error", "Could not delete claim.");
      }
    }
  };

  const handleApprove = async (claim) => {
    try {
      await respondToExpenseClaim(claim.ID || claim.id, 'Approved', '', activeUserName);
    } catch (e) {
      if (Platform.OS === 'web') window.alert("Error approving claim.");
      else Alert.alert("Error", "Error approving claim.");
    }
  };

  const openRejectModal = (claim) => {
    setSelectedClaim(claim);
    setRejectionReason('');
    setRejectionModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Validation Error", "Please provide a reason for rejecting this claim.");
      return;
    }
    await respondToExpenseClaim(selectedClaim.ID || selectedClaim.id, 'Rejected', rejectionReason, activeUserName);
    setRejectionModalVisible(false);
    Alert.alert("Rejected", "Expense claim has been rejected.");
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Page Title & Action */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Expense Claims</Text>
          <Text style={styles.subText}>Reimbursements & Business Expenses</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>New Claim</Text>
        </TouchableOpacity>
      </View>


      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <View style={styles.emptyCard}>
          <Receipt size={40} color={COLORS.textSecondary} style={{ marginBottom: 10 }} />
          <Text style={styles.emptyTitle}>No Expense Claims Found</Text>
          <Text style={styles.emptySub}>
            {activeTab === 'All'
              ? "You haven't submitted any expense reimbursement claims yet."
              : `No expense claims with status "${activeTab}".`}
          </Text>
        </View>
      ) : (
        [...filteredClaims].sort((a,b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0)).map((claim) => {
          const claimId = claim.ID || claim.id;
          const status = claim.Status || 'Pending';

          return (
            <View key={claimId} style={styles.claimCard}>
              {/* Card Header */}
              <View style={styles.claimCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.claimDescTitle}>{claim.Expense_Desc || 'Expense Claim'}</Text>
                  <Text style={styles.claimCategoryText}>
                    📌 {claim.Category} • Date: {claim.Expense_Date}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amountText}>₹{(parseFloat(claim.Total_Amount) || 0).toLocaleString()}</Text>
                  <AttendanceBadge status={status} />
                </View>
              </View>

              {claim.Description ? (
                <View style={styles.descBox}>
                  <Text style={styles.descBoxLabel}>Reason / Remarks:</Text>
                  <Text style={styles.descBoxText}>{claim.Description}</Text>
                </View>
              ) : null}


              {/* Rejection Note */}
              {status === 'Rejected' ? (
                <View style={styles.rejectionBox}>
                  <AlertCircle size={14} color={COLORS.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rejectionText, { marginBottom: 2 }]}>Rejected on: {(claim.Rejecteddate || claim.UpdatedDate || '').split('T')[0]}</Text>
                    {!!claim.Rejection_Reason && <Text style={styles.rejectionText}>Reason: {claim.Rejection_Reason}</Text>}
                  </View>
                </View>
              ) : null}

              {/* User Actions */}
              {status === 'Pending' && (claim.UserID === activeUserId || claim.CreatedByUId === activeUserId) && (
                <View style={styles.userActionRow}>
                  <TouchableOpacity style={styles.iconActionBtn} onPress={() => handleEditClaim(claim)}>
                    <Edit size={16} color={COLORS.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={() => handleDeleteClaim(claim.ID || claim.id)}>
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Admin Actions */}
              {isAdminOrHR && (
                <View style={styles.userActionRow}>
                  {status === 'Pending' && (
                    <>
                      <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]} onPress={() => handleApprove(claim)}>
                        <CheckCircle2 size={16} color={COLORS.success} />
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={() => openRejectModal(claim)}>
                        <XCircle size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}

      {/* New Expense Claim Submission Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Submit Expense Claim</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <XCircle size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <DatePickerInput
                label="Expense Date *"
                value={expenseDate}
                onChangeText={setExpenseDate}
              />

              <DatePickerInput
                label="Claim Date *"
                value={claimDate}
                onChangeText={setClaimDate}
              />

              <CustomInput
                label="Expense Description *"
                placeholder="Enter description..."
                value={expenseDesc}
                onChangeText={setExpenseDesc}
                icon={FileText}
              />

              <CustomInput
                label="Category *"
                placeholder="Enter category..."
                value={category}
                onChangeText={setCategory}
                icon={FileText}
              />

              <CustomInput
                label="Total Amount (₹) *"
                placeholder="0.00"
                value={totalAmount}
                onChangeText={setTotalAmount}
                icon={IndianRupee}
                keyboardType="numeric"
              />

              <CustomInput
                label="Description"
                placeholder="Enter additional description..."
                value={description}
                onChangeText={setDescription}
                icon={FileText}
                multiline={true}
                numberOfLines={3}
              />

              <PrimaryButton
                title="Submit Expense Claim"
                onPress={handleSubmitClaim}
                loading={loading}
                icon={Receipt}
                style={{ marginTop: 16, marginBottom: 10 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rejection Modal */}
      <Modal visible={rejectionModalVisible} transparent animationType="fade" onRequestClose={() => setRejectionModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { padding: 18 }]}>
            <Text style={styles.modalTitle}>Reject Expense Claim</Text>
            <Text style={styles.modalSub}>Provide reason for rejecting this reimbursement claim:</Text>

            <CustomInput
              label="Rejection Reason"
              placeholder="e.g. Bill receipt missing or exceeds policy limit"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              icon={FileText}
              multiline={true}
              numberOfLines={3}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtnModal} onPress={() => setRejectionModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmRejectBtn} onPress={handleConfirmReject}>
                <Text style={styles.confirmRejectText}>Confirm Rejection</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  tabsRow: {
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
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  claimCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
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
  claimCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  claimDescTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  claimCategoryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  metaGrid: {
    gap: 4,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaVal: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  descBox: {
    backgroundColor: COLORS.inputBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  descBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  descBoxText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  paymentStatusBar: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentStatusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  rejectionText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
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
  adminActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
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
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.danger,
    paddingVertical: 10,
    borderRadius: 10,
  },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  inputFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  formChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  formChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  formChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  paymentModeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  pmChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pmChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pmChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pmChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  receiptCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  receiptCheckboxText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtnModal: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmRejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
  },
  confirmRejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  confirmPayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
  },
  confirmPayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
