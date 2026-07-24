import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { PayrollContext } from '../../context/PayrollContext';
import { COLORS } from '../../constants/theme';
import { Wand2, CheckCircle2 } from 'lucide-react-native';

export const PayrollSetupWizardScreen = ({ navigation }) => {
  const { payrollConfig, savePayrollConfig } = useContext(PayrollContext);

  const [employeeCount, setEmployeeCount] = useState(String(payrollConfig.employeeCount || 15));
  const [salaryType, setSalaryType] = useState(payrollConfig.salaryType || 'Monthly');
  const [workingDays, setWorkingDays] = useState(String(payrollConfig.workingDaysPerMonth || 26));
  const [shiftTimings, setShiftTimings] = useState(payrollConfig.shiftTimings || '09:00 AM - 06:00 PM');
  const [overtimeRate, setOvertimeRate] = useState(String(payrollConfig.overtimeRate || 1.5));
  const [weeklyOff, setWeeklyOff] = useState(payrollConfig.weeklyOff || 'Sunday');
  const [paymentDate, setPaymentDate] = useState(String(payrollConfig.paymentDate || 5));

  const handleSave = () => {
    savePayrollConfig({
      employeeCount: Number(employeeCount),
      salaryType,
      workingDaysPerMonth: Number(workingDays),
      shiftTimings,
      overtimeRate: Number(overtimeRate),
      weeklyOff,
      paymentDate: Number(paymentDate),
    });
    Alert.alert("Success", "Payroll Setup Wizard configured successfully! Attendance & Payroll automation enabled.", [
      { text: "OK", onPress: () => navigation.navigate('ProcessPayroll') }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Wizard Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Wand2 size={28} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>One-Time Payroll Setup Wizard</Text>
        <Text style={styles.headerSubtitle}>
          Configure your company's core salary rules once to automate monthly attendance & payroll processing.
        </Text>
      </View>

      {/* Form Questions */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>1. Number of Active Employees</Text>
        <TextInput
          style={styles.input}
          value={employeeCount}
          onChangeText={setEmployeeCount}
          keyboardType="numeric"
          placeholder="e.g. 15"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.formTitle}>2. Primary Salary Type</Text>
        <View style={styles.tabContainer}>
          {['Monthly', 'Daily', 'Hourly'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.tabBtn, salaryType === type && styles.tabBtnActive]}
              onPress={() => setSalaryType(type)}
            >
              <Text style={[styles.tabText, salaryType === type && styles.tabTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formTitle}>3. Working Days Per Month</Text>
        <TextInput
          style={styles.input}
          value={workingDays}
          onChangeText={setWorkingDays}
          keyboardType="numeric"
          placeholder="e.g. 26"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.formTitle}>4. Default Shift Timings</Text>
        <TextInput
          style={styles.input}
          value={shiftTimings}
          onChangeText={setShiftTimings}
          placeholder="e.g. 09:00 AM - 06:00 PM"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.formTitle}>5. Overtime Multiplier Rate (x)</Text>
        <TextInput
          style={styles.input}
          value={overtimeRate}
          onChangeText={setOvertimeRate}
          keyboardType="numeric"
          placeholder="e.g. 1.5"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.formTitle}>6. Weekly Off Day</Text>
        <View style={styles.tabContainer}>
          {['Sunday', 'Saturday', 'Rotational'].map((off) => (
            <TouchableOpacity
              key={off}
              style={[styles.tabBtn, weeklyOff === off && styles.tabBtnActive]}
              onPress={() => setWeeklyOff(off)}
            >
              <Text style={[styles.tabText, weeklyOff === off && styles.tabTextActive]}>{off}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formTitle}>7. Monthly Salary Payment Date</Text>
        <TextInput
          style={styles.input}
          value={paymentDate}
          onChangeText={setPaymentDate}
          keyboardType="numeric"
          placeholder="e.g. 5th of every month"
          placeholderTextColor={COLORS.textSecondary}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <CheckCircle2 size={20} color="#ffffff" />
          <Text style={styles.saveBtnText}>Save & Enable Auto-Payroll</Text>
        </TouchableOpacity>
      </View>
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
  headerIcon: {
    backgroundColor: COLORS.activeTabBg,
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
});
