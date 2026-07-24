import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { EmployeeCard } from '../../components/EmployeeCard';
import { COLORS } from '../../constants/theme';
import { Search, UserPlus } from 'lucide-react-native';

import { AuthContext } from '../../context/AuthContext';

export const EmployeeListScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { employees, departments } = useContext(HRMSContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isEmployee = userRole === 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();
  const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();

  const filteredEmployees = employees.filter((emp) => {
    const empName = emp.name || emp.FullName || '';
    const empEmail = emp.email || emp.Email || '';
    const empDesig = emp.designation || emp.Designation || '';

    const matchesSearch =
      empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empDesig.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const displayedEmployees = isEmployee
    ? employees.filter(emp => {
        const empId = (emp.UserID || emp.id || '').trim().toLowerCase();
        const empName = (emp.FullName || emp.name || '').trim().toLowerCase();
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
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...departments.map(d => d.name)]}
          keyExtractor={(item) => item}
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

      {/* Employee List */}
      <FlatList
        data={displayedEmployees}
        keyExtractor={(item) => item.id}
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
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginLeft: 10,
  },
  filterWrapper: {
    marginBottom: 14,
    height: 38,
  },
  filterChip: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
