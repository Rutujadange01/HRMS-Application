import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { COLORS } from '../../constants/theme';
import { FileSpreadsheet, FileText } from 'lucide-react-native';

export const ReportsScreen = () => {
  const { employees, attendanceLogs, leaves } = useContext(HRMSContext);

  const reportTypes = [
    { title: 'Monthly Attendance Report', desc: 'Detailed log of present, absent, late, and overtime hours per employee.', records: attendanceLogs.length },
    { title: 'Payroll & Salary Report', desc: 'Gross salary, allowances, deductions, PF, ESIC, and net pay breakdown.', records: employees.length },
    { title: 'Employee Directory Export', desc: 'Complete employee list with contact, department, role, and bank details.', records: employees.length },
    { title: 'Leave & Balance Summary', desc: 'Casual, sick, and earned leave balances, approvals, and pending requests.', records: leaves.length },
    { title: 'Salary Advance & Loan Report', desc: 'Outstanding balances, EMI deductions, and sanction history.', records: 2 },
  ];

  const handleExport = (title, format) => {
    Alert.alert("Report Exported", `${title} has been generated in ${format} format and saved to device downloads.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <FileSpreadsheet size={26} color={COLORS.primary} />
        <Text style={styles.headerTitle}>HRMS Reports & Analytics</Text>
        <Text style={styles.headerSub}>Generate and export compliance reports in Excel & PDF formats.</Text>
      </View>

      <Text style={styles.sectionHeader}>Available System Reports</Text>

      {reportTypes.map((rep, idx) => (
        <View key={idx} style={styles.reportCard}>
          <Text style={styles.repTitle}>{rep.title}</Text>
          <Text style={styles.repDesc}>{rep.desc}</Text>
          <Text style={styles.repMeta}>{rep.records} Total Records</Text>

          <View style={styles.exportBtnRow}>
            <TouchableOpacity 
              style={styles.excelBtn}
              onPress={() => handleExport(rep.title, 'EXCEL (.xlsx)')}
            >
              <FileSpreadsheet size={14} color={COLORS.success} />
              <Text style={styles.excelText}>Export Excel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.pdfBtn}
              onPress={() => handleExport(rep.title, 'PDF Document')}
            >
              <FileText size={14} color={COLORS.primary} />
              <Text style={styles.pdfText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  repTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  repDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  repMeta: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  exportBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  excelBtn: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  excelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
    marginLeft: 6,
  },
  pdfBtn: {
    flex: 1,
    backgroundColor: COLORS.activeTabBg,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
});
