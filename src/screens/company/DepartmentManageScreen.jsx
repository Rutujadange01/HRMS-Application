import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { CustomInput } from '../../components/CustomInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Layers, Plus, UserCheck, Code } from 'lucide-react-native';

export const DepartmentManageScreen = ({ navigation }) => {
  const { departments, addDepartment } = useContext(HRMSContext);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [head, setHead] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddDept = async () => {
    if (!name || !code) {
      Alert.alert('Validation Error', 'Department name and code are required.');
      return;
    }
    setLoading(true);
    try {
      await addDepartment({ name, code: code.toUpperCase(), head: head || 'Unassigned' });
      setName('');
      setCode('');
      setHead('');
      Alert.alert('Success', 'New department created successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to add department.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Department Management</Text>
      <Text style={styles.screenSub}>Add, update or restructure corporate departments</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add New Department</Text>

        <CustomInput
          label="Department Name"
          placeholder="e.g. Quality Assurance"
          value={name}
          onChangeText={setName}
          icon={Layers}
        />

        <CustomInput
          label="Department Code"
          placeholder="e.g. QA"
          value={code}
          onChangeText={setCode}
          icon={Code}
        />

        <CustomInput
          label="Department Head / Lead"
          placeholder="e.g. Jane Smith"
          value={head}
          onChangeText={setHead}
          icon={UserCheck}
        />

        <PrimaryButton
          title="Create Department"
          onPress={handleAddDept}
          loading={loading}
          icon={Plus}
          style={{ marginTop: 8 }}
        />
      </View>

      <Text style={styles.sectionTitle}>Existing Departments</Text>
      {departments.map((dept) => (
        <View key={dept.id} style={styles.deptItem}>
          <View style={styles.deptMain}>
            <Text style={styles.deptTitle}>{dept.name}</Text>
            <Text style={styles.deptSub}>Code: {dept.code} • Lead: {dept.head}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{dept.employeeCount || 0} Employees</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  screenSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  deptItem: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  deptMain: {
    flex: 1,
  },
  deptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  deptSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
  },
});
