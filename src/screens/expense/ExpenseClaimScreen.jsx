import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
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
  AlertCircle
} from 'lucide-react-native';

export const ExpenseClaimScreen = ({ navigation }) => {
  const { profile, user } = useContext(AuthContext);
  const { expenseClaims = [], submitExpenseClaim, respondToExpenseClaim, processExpensePayment, deleteExpenseClaim } = useContext(HRMSContext);

  const rawRole = (profile?.role || profile?.Role || 'Employee').toString().trim().toLowerCase();
  const isAdminOrHR = rawRole === 'admin' || rawRole === 'hr' || rawRole === 'manager';
  const activeUserId = profile?.uid || profile?.UserID || 'emp_001';
  const activeUserName = profile?.name || profile?.FullName || user?.displayName || 'Employee';

  const [activeTab, setActiveTab] = useState('All'); // All | Pending | Approved | Rejected
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Form Fields mapped strictly to SSMS Emp_ExpenseClaims
  const [expenseDesc, setExpenseDesc] = useState('');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Travel & Conveyance');
  const [project, setProject] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [description, setDescription] = useState('');
  const [receiptAttached, setReceiptAttached] = useState(true);

  // Action states
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [loading, setLoading] = useState(false);

  const CATEGORIES = [
    'Travel & Conveyance',
    'Food & Meals',
    'Office Supplies',
    'Client Entertainment',
    'Medical Expense',
    'Hotel & Lodging',
    'Internet & Telephone',
    'Other'
  ];

  const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Cash', 'Cheque'];

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
      await submitExpenseClaim({
        UserID: activeUserId,
        CompanyID: profile?.companyId || 'comp_01',
        Expense_Desc: expenseDesc,
        Claim_Date: claimDate,
        Expense_Date: expenseDate,
        Description: description,
        Category: category,
        Project: project,
        Client_Name: clientName,
        Location: location,
        Total_Amount: totalAmount,
        Payment_Mode: paymentMode,
        Bank_Name: bankName,
        Account_Number: accountNumber,
        Receipt_Attached: receiptAttached,
        CreatedByUId: activeUserId,
        CreatedByUName: activeUserName
      });

      Alert.alert("Claim Submitted!", "Your expense claim has been submitted for approval.");
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
    setProject('');
    setClientName('');
    setLocation('');
    setBankName('');
    setAccountNumber('');
    setDescription('');
    setReceiptAttached(true);
  };

  const handleApprove = async (claim) => {
    Alert.alert(
      "Approve Claim",
      `Approve expense claim of ₹${claim.Total_Amount} submitted by ${claim.CreatedByUName || 'Employee'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Approve", 
          onPress: async () => {
            await respondToExpenseClaim(claim.ID || claim.id, 'Approved', '', activeUserName);
            Alert.alert("Approved", "Expense claim has been approved.");
          }
        }
      ]
    );
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

  const openPaymentModal = (claim) => {
    setSelectedClaim(claim);
    setPaymentRef(`PAY_REF_${Date.now().toString().slice(-6)}`);
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentRef.trim()) {
      Alert.alert("Validation Error", "Please enter Payment Reference Number.");
      return;
    }
    await processExpensePayment(selectedClaim.ID || selectedClaim.id, paymentRef, selectedClaim.Payment_Mode, activeUserName);
    setPaymentModalVisible(false);
    Alert.alert("Payment Logged!", `Marked as Paid with Reference #${paymentRef}.`);
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

      {/* Metrics Banner */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Claims</Text>
          <Text style={styles.metricValue}>{userClaims.length}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pending Approval</Text>
          <Text style={[styles.metricValue, { color: COLORS.secondary }]}>{pendingCount}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Approved</Text>
          <Text style={[styles.metricValue, { color: COLORS.success }]}>₹{totalApprovedAmount.toLocaleString()}</Text>
        </View>
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
        filteredClaims.map((claim) => {
          const claimId = claim.ID || claim.id;
          const status = claim.Status || 'Pending';
          const isPaid = claim.Payment_Status === 'Paid';

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

              {/* Meta Info Grid */}
              <View style={styles.metaGrid}>
                <Text style={styles.metaText}>👤 Claimed By: <Text style={styles.metaVal}>{claim.CreatedByUName || 'Employee'}</Text></Text>
                {claim.Project ? <Text style={styles.metaText}>💼 Project: <Text style={styles.metaVal}>{claim.Project}</Text></Text> : null}
                {claim.Client_Name ? <Text style={styles.metaText}>🏛 Client: <Text style={styles.metaVal}>{claim.Client_Name}</Text></Text> : null}
                {claim.Location ? <Text style={styles.metaText}>📍 Location: <Text style={styles.metaVal}>{claim.Location}</Text></Text> : null}
                <Text style={styles.metaText}>💳 Pay Mode: <Text style={styles.metaVal}>{claim.Payment_Mode}</Text></Text>
                <Text style={styles.metaText}>📎 Receipt: <Text style={styles.metaVal}>{claim.Receipt_Attached ? 'Attached ✅' : 'No Receipt ❌'}</Text></Text>
              </View>

              {claim.Description ? (
                <View style={styles.descBox}>
                  <Text style={styles.descBoxLabel}>Reason / Remarks:</Text>
                  <Text style={styles.descBoxText}>{claim.Description}</Text>
                </View>
              ) : null}

              {/* Payment Status Bar */}
              <View style={styles.paymentStatusBar}>
                <Text style={styles.paymentStatusText}>
                  Payment Status: <Text style={{ fontWeight: '800', color: isPaid ? COLORS.success : COLORS.secondary }}>
                    {isPaid ? `PAID (Ref: ${claim.Payment_Reference || 'PAY_OK'})` : 'UNPAID'}
                  </Text>
                </Text>
              </View>

              {/* Rejection Note */}
              {status === 'Rejected' && claim.Rejection_Reason ? (
                <View style={styles.rejectionBox}>
                  <AlertCircle size={14} color={COLORS.danger} />
                  <Text style={styles.rejectionText}>Rejection Reason: {claim.Rejection_Reason}</Text>
                </View>
              ) : null}

              {/* Admin Actions */}
              {isAdminOrHR && (
                <View style={styles.adminActionRow}>
                  {status === 'Pending' && (
                    <>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(claim)}>
                        <CheckCircle2 size={16} color="#ffffff" />
                        <Text style={styles.btnActionText}>Approve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.rejectBtn} onPress={() => openRejectModal(claim)}>
                        <XCircle size={16} color="#ffffff" />
                        <Text style={styles.btnActionText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {status === 'Approved' && !isPaid && (
                    <TouchableOpacity style={styles.payBtn} onPress={() => openPaymentModal(claim)}>
                      <CreditCard size={16} color="#ffffff" />
                      <Text style={styles.btnActionText}>Mark Paid / Process Reimbursement</Text>
                    </TouchableOpacity>
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

              <CustomInput
                label="Expense Description"
                placeholder="e.g. Flight ticket for client meeting"
                value={expenseDesc}
                onChangeText={setExpenseDesc}
                icon={FileText}
              />

              <CustomInput
                label="Total Amount"
                placeholder="e.g. 3500"
                value={totalAmount}
                onChangeText={setTotalAmount}
                icon={IndianRupee}
                keyboardType="numeric"
              />

              {/* Category Choice */}
              <Text style={styles.inputFieldLabel}>Expense Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.formChip, category === cat && styles.formChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.formChipText, category === cat && styles.formChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <DatePickerInput
                label="Date of Expense"
                value={expenseDate}
                onChangeText={setExpenseDate}
              />

              <CustomInput
                label="Project Name"
                placeholder="e.g. Techno Mobile App Redesign"
                value={project}
                onChangeText={setProject}
                icon={Briefcase}
              />

              <CustomInput
                label="Client Name"
                placeholder="e.g. Acme Corp Inc."
                value={clientName}
                onChangeText={setClientName}
                icon={Building2}
              />

              <CustomInput
                label="Location"
                placeholder="e.g. Mumbai HQ / Client Site"
                value={location}
                onChangeText={setLocation}
                icon={MapPin}
              />

              {/* Payment Mode Choice */}
              <Text style={styles.inputFieldLabel}>Preferred Payment Mode</Text>
              <View style={styles.paymentModeRow}>
                {PAYMENT_MODES.map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.pmChip, paymentMode === mode && styles.pmChipActive]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text style={[styles.pmChipText, paymentMode === mode && styles.pmChipTextActive]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CustomInput
                label="Bank Name"
                placeholder="e.g. HDFC Bank / ICICI Bank"
                value={bankName}
                onChangeText={setBankName}
                icon={Building2}
              />

              <CustomInput
                label="Account Number"
                placeholder="e.g. 50100293849102"
                value={accountNumber}
                onChangeText={setAccountNumber}
                icon={CreditCard}
                keyboardType="numeric"
              />

              <CustomInput
                label="Detailed Remarks / Reason"
                placeholder="Enter complete details about the business expense..."
                value={description}
                onChangeText={setDescription}
                icon={FileText}
                multiline={true}
                numberOfLines={3}
              />

              {/* Receipt Attached Checkbox */}
              <TouchableOpacity
                style={styles.receiptCheckboxRow}
                onPress={() => setReceiptAttached(!receiptAttached)}
              >
                {receiptAttached ? (
                  <CheckSquare size={20} color={COLORS.primary} />
                ) : (
                  <Square size={20} color={COLORS.border} />
                )}
                <Text style={styles.receiptCheckboxText}>Receipt / Invoice Attached</Text>
              </TouchableOpacity>

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

      {/* Payment Processing Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { padding: 18 }]}>
            <Text style={styles.modalTitle}>Process Expense Reimbursement</Text>
            <Text style={styles.modalSub}>Enter Payment Transaction Reference Number:</Text>

            <CustomInput
              label="Payment Reference Number"
              placeholder="e.g. UTR1029384819 / CHQ99201"
              value={paymentRef}
              onChangeText={setPaymentRef}
              icon={CreditCard}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtnModal} onPress={() => setPaymentModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmPayBtn} onPress={handleConfirmPayment}>
                <Text style={styles.confirmPayText}>Mark Paid</Text>
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
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
