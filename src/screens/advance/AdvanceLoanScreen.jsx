import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { PayrollContext } from '../../context/PayrollContext';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { CreditCard, PlusCircle } from 'lucide-react-native';

export const AdvanceLoanScreen = () => {
  const { profile } = useContext(AuthContext);
  const { loans, requestLoan, updateLoanStatus } = useContext(PayrollContext);
  const { employees } = useContext(HRMSContext);

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isEmployee = userRole === 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();

  const displayedLoans = isEmployee
    ? (loans || []).filter(l => {
        const lUid = (l.employeeId || l.UserID || '').trim().toLowerCase();
        const lName = (l.employeeName || l.UserName || '').trim().toLowerCase();
        return (profUid && lUid === profUid) || (profName && lName === profName);
      })
    : (loans || []);

  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState('Salary Advance'); // Salary Advance | Personal Loan
  const [amount, setAmount] = useState('');
  const [emi, setEmi] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(profile?.name || profile?.FullName || employees[0]?.name || 'Alex Rivers');

  const handleApply = () => {
    if (!amount || !emi) {
      Alert.alert("Missing Fields", "Please enter requested amount and EMI deduction.");
      return;
    }

    requestLoan({
      employeeId: profile?.uid || profile?.UserID || ('emp_' + Date.now()),
      employeeName: isEmployee ? (profile?.name || profile?.FullName || 'Employee') : selectedEmp,
      type,
      amount: Number(amount),
      emi: Number(emi)
    });

    setModalVisible(false);
    setAmount('');
    setEmi('');
    Alert.alert("Request Submitted", "Salary advance request submitted for manager approval.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Cards */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <CreditCard size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>{isEmployee ? 'My Salary Advance & Loans' : 'Salary Advance & Loans'}</Text>
        </View>
        <Text style={styles.headerSub}>{isEmployee ? 'Request salary advance and track monthly EMI deductions.' : 'Manage employee advances, loans, and automated monthly EMI deductions.'}</Text>

        <TouchableOpacity style={styles.applyBtn} onPress={() => setModalVisible(true)}>
          <PlusCircle size={18} color="#ffffff" />
          <Text style={styles.applyBtnText}>Request Salary Advance / Loan</Text>
        </TouchableOpacity>
      </View>

      {/* Outstanding Balance List */}
      <Text style={styles.sectionHeader}>{isEmployee ? 'My Active Loans & Salary Advances' : 'Active Loans & Salary Advances'} ({displayedLoans.length})</Text>

      {displayedLoans.length === 0 ? (
        <View style={styles.loanCard}>
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginVertical: 12 }}>
            {isEmployee ? 'You have no active salary advance or loan requests.' : 'No active loans or salary advance requests.'}
          </Text>
        </View>
      ) : (
        displayedLoans.map((loan) => (
          <View key={loan.id} style={styles.loanCard}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.empName}>{loan.employeeName}</Text>
                <Text style={styles.loanType}>{loan.type} • Applied {loan.requestDate}</Text>
              </View>

              <View style={[styles.statusBadge, loan.status === 'Approved' ? styles.badgeApproved : styles.badgePending]}>
                <Text style={[styles.statusText, loan.status === 'Approved' ? styles.textApproved : styles.textPending]}>
                  {loan.status}
                </Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridBox}>
                <Text style={styles.gLabel}>Total Sanctioned</Text>
                <Text style={styles.gValue}>₹{loan.amount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.gridBox}>
                <Text style={styles.gLabel}>Monthly EMI</Text>
                <Text style={styles.gValue}>₹{loan.emi.toLocaleString('en-IN')}/mo</Text>
              </View>
              <View style={styles.gridBox}>
                <Text style={styles.gLabel}>Outstanding</Text>
                <Text style={[styles.gValue, { color: COLORS.danger }]}>₹{loan.balance.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {!isEmployee && loan.status === 'Pending' && (
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.approveBtn} 
                  onPress={() => updateLoanStatus(loan.id, 'Approved')}
                >
                  <Text style={styles.approveText}>Approve Request</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      {/* New Request Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Salary Advance / Loan</Text>

            <Text style={styles.inputLabel}>Request Type</Text>
            <View style={styles.typeRow}>
              {['Salary Advance', 'Personal Loan'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Requested Amount (₹ INR)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="e.g. 25000"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>Monthly EMI Deduction (₹ INR)</Text>
            <TextInput
              style={styles.input}
              value={emi}
              onChangeText={setEmi}
              keyboardType="numeric"
              placeholder="e.g. 5000"
              placeholderTextColor={COLORS.textSecondary}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleApply}>
              <Text style={styles.submitBtnText}>Submit Request</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
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
  headerCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
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
  loanCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  loanType: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgePending: {
    backgroundColor: 'rgba(253, 172, 100, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textApproved: {
    color: COLORS.success,
  },
  textPending: {
    color: COLORS.warning,
  },
  grid: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  gridBox: {
    alignItems: 'center',
  },
  gLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  gValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  actionRow: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  approveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(63, 71, 82, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 10,
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  closeText: {
    color: COLORS.textSecondary,
  },
});
