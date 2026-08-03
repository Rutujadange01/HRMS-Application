import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { EmployeeCard } from '../../components/EmployeeCard';
import { COLORS } from '../../constants/theme';
import { Search, UserPlus } from 'lucide-react-native';
import { AuthContext } from '../../context/AuthContext';

export const EmployeeListScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { employees = [], departments = [] } = useContext(HRMSContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isEmployee = userRole === 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();
  const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();

  const deptList = ['All', ...(departments || []).map(d => (typeof d === 'string' ? d : d?.name || d?.DepartmentName || d?.Department || ''))].filter(Boolean);

  const filteredEmployees = (employees || []).filter((emp) => {
    const empName = emp.FullName || emp.name || emp.Username || '';
    const empEmail = emp.Email || emp.email || '';
    const empDesig = emp.Designation || emp.designation || '';
    const empDept = emp.Department || emp.department || emp.DepartmentID || '';

    const matchesSearch =
      empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empDesig.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'All' || empDept.toLowerCase() === selectedDept.toLowerCase();

    return matchesSearch && matchesDept;
  });

  const displayedEmployees = isEmployee
    ? (employees || []).filter(emp => {
        const empId = (emp.UserID || emp.id || emp.UserCode || '').trim().toLowerCase();
        const empName = (emp.FullName || emp.name || emp.Username || '').trim().toLowerCase();
        const empEmail = (emp.Email || emp.email || '').trim().toLowerCase();
        return (profUid && empId === profUid) || (profName && empName === profName) || (profEmail && empEmail === profEmail);
      })
    : filteredEmployees;

  return (
    <View style={styles.container}>
      {/* Header bar with title and Add button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{isEmployee ? 'My Profile Record' : 'Employee Directory'}</Text>
          <Text style={styles.subtitle}>{isEmployee ? 'Personal Staff Identity' : `${displayedEmployees.length} registered team members`}</Text>
        </View>

        {!isEmployee && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddEmployee')}
          >
            <UserPlus size={18} color="#ffffff" />
            <Text style={styles.addBtnText}>Add Staff</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, role or email..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Department Filter Chips */}
      {deptList.length > 1 && (
        <View style={styles.filterWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={deptList}
            keyExtractor={(item, index) => item + index}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, selectedDept === item && styles.filterChipActive]}
                onPress={() => setSelectedDept(item)}
              >
                <Text style={[styles.filterChipText, selectedDept === item && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Employee List */}
      <FlatList
        data={displayedEmployees}
        keyExtractor={(item, index) => item.id || item.UserID || item.UserCode || index.toString()}
        renderItem={({ item }) => (
          <EmployeeCard
            employee={item}
            onPress={() => navigation.navigate('EmployeeDetail', { employee: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No employees matching search parameters.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
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
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterWrapper: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
