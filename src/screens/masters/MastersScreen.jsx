import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { companyService } from '../../services/companyService';
import { COLORS } from '../../constants/theme';
import { Settings, Layers, Clock, Calendar, Plus, Trash2 } from 'lucide-react-native';

export const MastersScreen = () => {
  const { departments, addDepartment, deleteDepartment } = useContext(HRMSContext);

  const [activeTab, setActiveTab] = useState('dept'); // dept | shift | holiday
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [shiftModalVisible, setShiftModalVisible] = useState(false);

  // Department SSMS Master Fields
  const [deptName, setDeptName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Shift SSMS Master Fields
  const [shifts, setShifts] = useState([
    {
      ShiftID: 'sh_01',
      ShiftName: 'General Morning Shift',
      ShortName: 'GEN',
      StartTime: '09:00 AM',
      EndTime: '06:00 PM',
      Break1StartTime: '01:00 PM',
      Break1EndTime: '02:00 PM',
      GraceTime_Min: 15,
      IsActive: true
    },
    {
      ShiftID: 'sh_02',
      ShiftName: 'Night Shift',
      ShortName: 'NIGHT',
      StartTime: '09:00 PM',
      EndTime: '06:00 AM',
      Break1StartTime: '01:00 AM',
      Break1EndTime: '02:00 AM',
      GraceTime_Min: 15,
      IsActive: true
    }
  ]);

  const [shiftName, setShiftName] = useState('');
  const [shiftShort, setShiftShort] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [graceMin, setGraceMin] = useState('15');

  const [holidays] = useState([
    { id: 'hol_1', title: 'Independence Day', date: '2026-08-15', day: 'Saturday' },
    { id: 'hol_2', title: 'Diwali Festival', date: '2026-11-08', day: 'Sunday' },
    { id: 'hol_3', title: 'New Year Day', date: '2027-01-01', day: 'Friday' },
  ]);

  const handleAddDept = async () => {
    if (!deptName || !shortName) {
      Alert.alert("Missing Fields", "Please enter Department Name and Short Name.");
      return;
    }

    setLoading(true);
    const deptId = 'dept_' + Date.now();
    const deptPayload = {
      DepartmentID: deptId,
      id: deptId,
      DepartmentName: deptName,
      name: deptName,
      CompanyID: 'comp_01',
      ShortName: shortName,
      code: shortName,
      Description: description || 'Department Unit',
      IsActive: true,
      CreatedByUId: 'demo_admin_123',
      CreatedByUName: 'Sarah Jenkins',
      CreatedDate: new Date().toISOString(),
      head: 'Manager',
      employeeCount: 0
    };

    try {
      await companyService.addDepartment(deptPayload);
      await addDepartment(deptPayload);

      Alert.alert("Success", "Department Created");
      setDeptModalVisible(false);
      setDeptName('');
      setShortName('');
      setDescription('');
    } catch (error) {
      Alert.alert("Database Error", `Failed to save Department: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddShift = () => {
    if (!shiftName || !shiftShort) {
      Alert.alert("Missing Fields", "Please enter Shift Name and Short Name.");
      return;
    }

    const shiftId = 'sh_' + Date.now();
    const newShift = {
      ShiftID: shiftId,
      ShiftName: shiftName,
      ShortName: shiftShort,
      StartTime: startTime,
      EndTime: endTime,
      GraceTime_Min: Number(graceMin) || 15,
      IsActive: true,
      CompanyID: 'comp_01'
    };

    setShifts([...shifts, newShift]);
    setShiftModalVisible(false);
    setShiftName('');
    setShiftShort('');
    Alert.alert("Success", "Shift Created");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Settings size={26} color={COLORS.primary} />
        <Text style={styles.headerTitle}>System Masters Setup</Text>
        <Text style={styles.headerSub}>Manage company departments & shift master configuration.</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {[
          { id: 'dept', label: 'Department Master', icon: Layers },
          { id: 'shift', label: 'Shift Master', icon: Clock },
          { id: 'holiday', label: 'Holiday Calendar', icon: Calendar },
        ].map((tab) => {
          const IconC = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconC size={16} color={isActive ? '#ffffff' : COLORS.textSecondary} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Department Master */}
      {activeTab === 'dept' && (
        <View>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Master_DepartmentMaster ({departments.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setDeptModalVisible(true)}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addText}>Add Dept Master</Text>
            </TouchableOpacity>
          </View>

          {departments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No departments created yet. Tap '+ Add Dept Master' above to create!</Text>
            </View>
          ) : (
            departments.map((d) => (
              <View key={d.id || d.DepartmentID} style={styles.card}>
                <View style={styles.cardRow}>
                  <View>
                    <Text style={styles.cardTitle}>{d.DepartmentName || d.name}</Text>
                    <Text style={styles.cardSub}>
                      ShortName: {d.ShortName || d.code} • Doc ID: {d.id || d.DepartmentID}
                    </Text>
                    {d.Description ? <Text style={styles.descText}>{d.Description}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => deleteDepartment(d.id || d.DepartmentID)}>
                    <Trash2 size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Shift Master */}
      {activeTab === 'shift' && (
        <View>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Master_ShiftMaster ({shifts.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShiftModalVisible(true)}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addText}>Add Shift Master</Text>
            </TouchableOpacity>
          </View>

          {shifts.map((s) => (
            <View key={s.ShiftID} style={styles.card}>
              <Text style={styles.cardTitle}>{s.ShiftName} [{s.ShortName}]</Text>
              <Text style={styles.cardSub}>
                Timing: {s.StartTime} - {s.EndTime} • Grace: {s.GraceTime_Min} mins
              </Text>
              <Text style={styles.descText}>Status: Active</Text>
            </View>
          ))}
        </View>
      )}

      {/* Holiday Master */}
      {activeTab === 'holiday' && (
        <View>
          <Text style={styles.sectionTitle}>Company Holiday Calendar 2026</Text>
          {holidays.map((h) => (
            <View key={h.id} style={styles.card}>
              <Text style={styles.cardTitle}>{h.title}</Text>
              <Text style={styles.cardSub}>{h.date} ({h.day})</Text>
            </View>
          ))}
        </View>
      )}

      {/* Add Dept Modal */}
      <Modal visible={deptModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Master_DepartmentMaster</Text>

            <Text style={styles.inputLabel}>Department Name</Text>
            <TextInput
              style={styles.input}
              value={deptName}
              onChangeText={setDeptName}
              placeholder="e.g. Quality Assurance"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>Department Short Name</Text>
            <TextInput
              style={styles.input}
              value={shortName}
              onChangeText={setShortName}
              placeholder="e.g. QA"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Software Testing & Compliance"
              placeholderTextColor={COLORS.textSecondary}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddDept} disabled={loading}>
              <Text style={styles.submitText}>{loading ? 'Saving...' : 'Save Department Master'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setDeptModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Shift Modal */}
      <Modal visible={shiftModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Master_ShiftMaster</Text>

            <Text style={styles.inputLabel}>Shift Name</Text>
            <TextInput
              style={styles.input}
              value={shiftName}
              onChangeText={setShiftName}
              placeholder="e.g. Evening Flex Shift"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>Shift Short Code</Text>
            <TextInput
              style={styles.input}
              value={shiftShort}
              onChangeText={setShiftShort}
              placeholder="e.g. EVEN"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>Start Time</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="02:00 PM"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>End Time</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="11:00 PM"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.inputLabel}>Grace Time Minutes</Text>
            <TextInput
              style={styles.input}
              value={graceMin}
              onChangeText={setGraceMin}
              placeholder="15"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddShift}>
              <Text style={styles.submitText}>Insert Shift Master</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShiftModalVisible(false)}>
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
  tabsScroll: {
    marginBottom: 16,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
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
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  descText: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
  },
  // Fixed:
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(63, 71, 82, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 10,
    marginBottom: 4,
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
    marginTop: 18,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 6,
  },
  closeText: {
    color: COLORS.textSecondary,
  },
});
