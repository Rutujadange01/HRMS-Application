import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { DatePickerInput } from '../../components/DatePickerInput';
import { CustomInput } from '../../components/CustomInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { Clock, Users, CheckSquare, Square, ArrowLeft, ShieldCheck, CheckCircle2, UserCheck, Calendar, Filter } from 'lucide-react-native';

export const BulkAttendanceScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { employees = [], attendanceLogs, setAttendanceLogs } = useContext(HRMSContext);

  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [punchType, setPunchType] = useState('In'); // In | Out
  const [punchTime, setPunchTime] = useState('09:00 AM');
  const [remarks, setRemarks] = useState('Bulk Admin Manual Punch Entry');
  const [loading, setLoading] = useState(false);

  // Role Protection: Admin, HR, Manager ONLY
  const userRole = (profile?.role || profile?.Role || 'Employee').toString().trim().toLowerCase();
  const isAdminOrHR = userRole === 'admin' || userRole === 'hr' || userRole === 'manager';

  // Filter employees for logged-in user's company
  const companyId = profile?.companyId || 'comp_01';
  const companyEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const eComp = e.CompanyID || e.companyId || 'comp_01';
      return eComp === companyId;
    });
  }, [employees, companyId]);

  // Selected Employee IDs State (Default: All checked)
  const [selectedEmpIds, setSelectedEmpIds] = useState(() => {
    return companyEmployees.map(e => e.id || e.ID || e.UserID);
  });

  const isAllSelected = selectedEmpIds.length === companyEmployees.length && companyEmployees.length > 0;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(companyEmployees.map(e => e.id || e.ID || e.UserID));
    }
  };

  const handleToggleEmployee = (empId) => {
    if (selectedEmpIds.includes(empId)) {
      setSelectedEmpIds(selectedEmpIds.filter(id => id !== empId));
    } else {
      setSelectedEmpIds([...selectedEmpIds, empId]);
    }
  };

  const handleProcessBulkPunch = async () => {
    if (!isAdminOrHR) {
      Alert.alert("Access Denied", "Bulk Mark Attendance is restricted to Admin, HR, and Managers only.");
      return;
    }

    if (selectedEmpIds.length === 0) {
      Alert.alert("Validation Error", "Please select at least one employee to mark bulk attendance.");
      return;
    }

    if (!targetDate || !punchTime) {
      Alert.alert("Validation Error", "Target date and punch time are required.");
      return;
    }

    setLoading(true);

    try {
      const selectedEmpObjects = companyEmployees.filter(e => 
        selectedEmpIds.includes(e.id || e.ID || e.UserID)
      );

      const newLogs = selectedEmpObjects.map(emp => {
        const empId = emp.id || emp.ID || emp.UserID || 'emp_001';
        const empName = emp.name || emp.FullName || emp.employeeName || 'Employee';

        return {
          CompanyID: companyId,
          PunchID: 'bulk_punch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          id: 'bulk_punch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          UserID: empId,
          employeeId: empId,
          UserName: empName,
          employeeName: empName,
          Time: punchTime,
          clockIn: punchType === 'In' ? punchTime : '09:00 AM',
          clockOut: punchType === 'Out' ? punchTime : '--:--',
          workHrs: punchType === 'Out' ? '8 hrs 00 mins (Bulk Out)' : 'In Progress (Bulk In)',
          status: 'Present',
          Flag: 'P',
          Location: `Office HQ (${remarks})`,
          location: `Office HQ (${remarks})`,
          method: `Bulk Admin Entry by ${profile?.name || 'Admin'}`,
          date: targetDate,
          PostingDate: targetDate,
          CreatedOn: new Date().toISOString(),
          CreatedByUId: profile?.uid || profile?.UserID || 'admin_1',
          CreatedByUName: profile?.name || profile?.FullName || 'Admin'
        };
      });

      if (setAttendanceLogs) {
        setAttendanceLogs(prev => [...newLogs, ...prev]);
      }

      Alert.alert(
        "Bulk Punch Success!",
        `Successfully marked Punch ${punchType} for ${selectedEmpObjects.length} employee(s) on ${targetDate} at ${punchTime}.`
      );

      navigation.navigate('DailyAttendance');
    } catch (error) {
      Alert.alert("Error", `Failed to process bulk attendance: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminOrHR) {
    return (
      <View style={styles.accessDeniedContainer}>
        <ShieldCheck size={50} color={COLORS.danger} />
        <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
        <Text style={styles.accessDeniedSub}>
          Bulk Mark Attendance is available only to Admin, HR, and Manager roles.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Screen Title */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Bulk Mark Attendance</Text>
          <Text style={styles.screenSub}>Batch mark punch IN/OUT for company employees</Text>
        </View>
      </View>

      {/* Target Date & Punch Config Card */}
      <View style={styles.configCard}>
        <Text style={styles.cardSectionHeader}>1. Attendance Punch Settings</Text>

        <DatePickerInput
          label="Target Attendance Date"
          value={targetDate}
          onChangeText={setTargetDate}
        />

        {/* Punch Type Selector */}
        <Text style={styles.formLabel}>Punch Action Type</Text>
        <View style={styles.typeSelectorRow}>
          <TouchableOpacity
            style={[styles.typeChipBtn, punchType === 'In' && styles.typeChipInActive]}
            onPress={() => {
              setPunchType('In');
              setPunchTime('09:00 AM');
            }}
          >
            <Clock size={16} color={punchType === 'In' ? '#ffffff' : COLORS.textSecondary} />
            <Text style={[styles.typeChipText, punchType === 'In' && styles.typeChipTextActive]}>
              Mark Punch IN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeChipBtn, punchType === 'Out' && styles.typeChipOutActive]}
            onPress={() => {
              setPunchType('Out');
              setPunchTime('06:00 PM');
            }}
          >
            <Clock size={16} color={punchType === 'Out' ? '#ffffff' : COLORS.textSecondary} />
            <Text style={[styles.typeChipText, punchType === 'Out' && styles.typeChipTextActive]}>
              Mark Punch OUT
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Time Presets */}
        <Text style={styles.formLabel}>Punch Time</Text>
        <View style={styles.timePresetRow}>
          {['09:00 AM', '09:30 AM', '10:00 AM', '06:00 PM', '06:30 PM'].map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.timeChip, punchTime === preset && styles.timeChipActive]}
              onPress={() => setPunchTime(preset)}
            >
              <Text style={[styles.timeChipText, punchTime === preset && styles.timeChipTextActive]}>
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <CustomInput
          label="Or Type Custom Punch Time"
          placeholder="e.g. 09:15 AM or 06:45 PM"
          value={punchTime}
          onChangeText={setPunchTime}
          icon={Clock}
        />

        <CustomInput
          label="Remarks / Audit Note"
          placeholder="e.g. On-site Client Deployment / System Maintenance"
          value={remarks}
          onChangeText={setRemarks}
          icon={ShieldCheck}
        />
      </View>

      {/* Employee Selection List Section */}
      <View style={styles.empListSection}>
        <View style={styles.empListHeaderRow}>
          <View>
            <Text style={styles.cardSectionHeader}>2. Select Employees ({selectedEmpIds.length}/{companyEmployees.length})</Text>
            <Text style={styles.empListSub}>Filtered for your company directory</Text>
          </View>

          <TouchableOpacity style={styles.selectAllBtn} onPress={handleToggleSelectAll}>
            {isAllSelected ? (
              <CheckSquare size={18} color={COLORS.primary} />
            ) : (
              <Square size={18} color={COLORS.textSecondary} />
            )}
            <Text style={[styles.selectAllText, isAllSelected && { color: COLORS.primary }]}>
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        {companyEmployees.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={32} color={COLORS.textSecondary} style={{ marginBottom: 6 }} />
            <Text style={styles.emptyTitle}>No Employees Found</Text>
            <Text style={styles.emptySub}>No active employees registered under this company.</Text>
          </View>
        ) : (
          companyEmployees.map((emp) => {
            const empId = emp.id || emp.ID || emp.UserID;
            const isChecked = selectedEmpIds.includes(empId);
            const avatarUri = emp.avatar || emp.UPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';

            return (
              <TouchableOpacity
                key={empId}
                style={[styles.empRowCard, isChecked && styles.empRowCardChecked]}
                onPress={() => handleToggleEmployee(empId)}
                activeOpacity={0.8}
              >
                <View style={styles.checkboxBox}>
                  {isChecked ? (
                    <CheckSquare size={20} color={COLORS.primary} />
                  ) : (
                    <Square size={20} color={COLORS.border} />
                  )}
                </View>

                <Image source={{ uri: avatarUri }} style={styles.empAvatar} />

                <View style={styles.empMetaInfo}>
                  <Text style={styles.empNameText}>{emp.name || emp.FullName || 'Employee'}</Text>
                  <Text style={styles.empSubText}>
                    {emp.designation || emp.Designation || 'Staff'} • {emp.department || emp.Department || 'HR'}
                  </Text>
                  <Text style={styles.empIdText}>ID: {emp.userCode || emp.UserCode || empId}</Text>
                </View>

                {isChecked && (
                  <View style={styles.selectedBadge}>
                    <CheckCircle2 size={16} color={COLORS.success} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Process Bulk Attendance Action Container */}
      <View style={styles.actionFooterCard}>
        <View style={styles.actionFooterInfo}>
          <Text style={styles.actionFooterTitle}>Batch Attendance Confirmation</Text>
          <Text style={styles.actionFooterSub}>
            Date: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{targetDate}</Text> • Time: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{punchTime}</Text>
          </Text>
        </View>

        <PrimaryButton
          title={`Process Bulk Punch ${punchType} (${selectedEmpIds.length} Selected)`}
          onPress={handleProcessBulkPunch}
          loading={loading}
          icon={Users}
          style={punchType === 'Out' ? { backgroundColor: COLORS.secondary } : {}}
        />
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
  actionFooterCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  actionFooterInfo: {
    marginBottom: 12,
    alignItems: 'center',
  },
  actionFooterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  actionFooterSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  headerRow: {
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
  },
  screenSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  adminRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.activeTabBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  adminRoleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  configCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardSectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
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
    gap: 10,
    marginBottom: 10,
  },
  typeChipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipInActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  typeChipOutActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeChipTextActive: {
    color: '#ffffff',
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
  empListSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  empListHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  empListSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  empRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  empRowCardChecked: {
    backgroundColor: 'rgba(241, 94, 140, 0.06)',
    borderColor: COLORS.primary,
  },
  checkboxBox: {
    marginRight: 10,
  },
  empAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  empMetaInfo: {
    flex: 1,
  },
  empNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  empSubText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  empIdText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  selectedBadge: {
    marginLeft: 6,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: COLORS.background,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 14,
  },
  accessDeniedSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  backBtnDenied: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backTextDenied: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
