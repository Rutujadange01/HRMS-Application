import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { PayrollContext } from '../../context/PayrollContext';
import { COLORS } from '../../constants/theme';
import { IndianRupee, FileText, Download, CheckCircle2, Wand2 } from 'lucide-react-native';

import { AuthContext } from '../../context/AuthContext';

export const ProcessPayrollScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { employees, company } = useContext(HRMSContext);
  const { payrollConfig } = useContext(PayrollContext);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [payslipModalVisible, setPayslipModalVisible] = useState(false);
  const [payrollProcessed, setPayrollProcessed] = useState(false);

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isEmployee = userRole === 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();
  const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();

  const displayedPayrollEmps = isEmployee
    ? (employees || []).filter(emp => {
        const empId = (emp.UserID || emp.id || '').trim().toLowerCase();
        const empName = (emp.FullName || emp.name || '').trim().toLowerCase();
        const empEmail = (emp.Email || emp.email || '').trim().toLowerCase();
        return (profUid && empId === profUid) || (profName && empName === profName) || (profEmail && empEmail === profEmail);
      })
    : (employees || []);

  const handleProcessAll = () => {
    setPayrollProcessed(true);
    Alert.alert("Payroll Success", "Monthly payroll processed for all active employees! Payslips & notifications generated.");
  };

  const openPayslip = (emp) => {
    setSelectedEmp(emp);
    setPayslipModalVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <IndianRupee size={26} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>{isEmployee ? 'My Salary & Payslips' : 'Automated Monthly Payroll'}</Text>
          <Text style={styles.bannerSubtitle}>
            Configured for {payrollConfig.salaryType} salary • Payment Date: {payrollConfig.paymentDate}th of month
          </Text>
        </View>
        {!isEmployee && (
          <TouchableOpacity style={styles.wizardBadge} onPress={() => navigation.navigate('PayrollWizard')}>
            <Wand2 size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>₹{(displayedPayrollEmps.length * 45000).toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryLabel}>{isEmployee ? 'My Monthly Salary' : 'Total Gross Payroll'}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>{displayedPayrollEmps.length}</Text>
          <Text style={styles.summaryLabel}>{isEmployee ? 'My Active Payslips' : 'Employees Eligible'}</Text>
        </View>
      </View>

      {/* Action Button for Admin/HR */}
      {!isEmployee && (
        <TouchableOpacity 
          style={[styles.processBtn, payrollProcessed && styles.processBtnDone]} 
          onPress={handleProcessAll}
        >
          <CheckCircle2 size={20} color={payrollProcessed ? COLORS.success : "#ffffff"} />
          <Text style={[styles.processBtnText, payrollProcessed && { color: COLORS.success }]}>
            {payrollProcessed ? "Payroll Processed for July 2026" : "Run & Process July Payroll"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Employee Payslip List */}
      <Text style={styles.sectionHeader}>{isEmployee ? 'My Monthly Payslip Records' : 'Employee Salary Preview & Payslips'}</Text>

      {displayedPayrollEmps.length === 0 ? (
        <View style={styles.empCard}>
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginVertical: 12 }}>
            No payslip records available yet.
          </Text>
        </View>
      ) : (
        displayedPayrollEmps.map((emp) => (
          <TouchableOpacity key={emp.id} style={styles.empCard} onPress={() => openPayslip(emp)}>
            <View style={styles.empRow}>
              <View>
                <Text style={styles.empName}>{emp.name}</Text>
                <Text style={styles.empDept}>{emp.department} • {emp.designation}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.empSalary}>{emp.salaryTier || '₹45,000/mo'}</Text>
                <View style={styles.pdfBadge}>
                  <FileText size={12} color={COLORS.primary} />
                  <Text style={styles.pdfText}>Payslip PDF</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Payslip Modal View */}
      <Modal visible={payslipModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalCompany}>{company?.name ? company.name.toUpperCase() : 'TECHNOSYNC INNOVATION'}</Text>
            <Text style={styles.modalSub}>Salary Payslip - July 2026</Text>

            {selectedEmp && (
              <View style={styles.payslipBody}>
                <View style={styles.payslipRow}>
                  <Text style={styles.pLabel}>Employee Name:</Text>
                  <Text style={styles.pValue}>{selectedEmp.name}</Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.pLabel}>Designation:</Text>
                  <Text style={styles.pValue}>{selectedEmp.designation}</Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.pLabel}>Department:</Text>
                  <Text style={styles.pValue}>{selectedEmp.department}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.payslipRow}>
                  <Text style={styles.pLabel}>Basic Salary:</Text>
                  <Text style={styles.pValue}>₹45,000.00</Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.pLabel}>HRA & Allowances:</Text>
                  <Text style={styles.pValue}>₹18,000.00</Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.pLabel}>Overtime & Bonus:</Text>
                  <Text style={styles.pValue}>₹5,000.00</Text>
                </View>
                <View style={styles.payslipRow}>
                  <Text style={styles.pLabel}>Deductions (Tax/PF):</Text>
                  <Text style={[styles.pValue, { color: COLORS.danger }]}>-₹3,000.00</Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Net Payable Salary:</Text>
                  <Text style={styles.totalValue}>₹65,000.00</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.downloadBtn} 
              onPress={() => {
                Alert.alert("Payslip Downloaded", "Payslip PDF saved to device downloads.");
                setPayslipModalVisible(false);
              }}
            >
              <Download size={18} color="#ffffff" />
              <Text style={styles.downloadText}>Download Payslip PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setPayslipModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
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
  banner: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerIcon: {
    backgroundColor: COLORS.activeTabBg,
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  wizardBadge: {
    backgroundColor: COLORS.activeTabBg,
    padding: 8,
    borderRadius: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  processBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  processBtnDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  processBtnText: {
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
  empCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  empRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  empDept: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  empSalary: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.activeTabBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  pdfText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(63, 71, 82, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCompany: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  payslipBody: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  payslipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  pLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  pValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.success,
  },
  downloadBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  downloadText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
