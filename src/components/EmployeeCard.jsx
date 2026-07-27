import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { AttendanceBadge } from './AttendanceBadge';
import { COLORS } from '../constants/theme';
import { Mail, Phone, ChevronRight } from 'lucide-react-native';

export const EmployeeCard = ({ employee, onPress }) => {
  if (!employee) return null;

  const empName = employee.FullName || employee.name || employee.Username || 'Staff Member';
  const empPhoto = employee.UPhoto || employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(empName)}&background=F15E8C&color=fff`;
  const empStatus = employee.Status || employee.status || 'Active';
  const empDesig = employee.Designation || employee.designation || 'Staff Member';
  const empDept = employee.Department || employee.department || employee.DepartmentID || 'General';
  const empEmail = employee.Email || employee.email || '--';
  const empPhone = employee.MobileNo || employee.phone || '--';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={{ uri: empPhoto }}
        style={styles.avatar}
      />
      <View style={styles.infoContainer}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{empName}</Text>
          <AttendanceBadge status={empStatus} />
        </View>
        <Text style={styles.designation} numberOfLines={1}>{empDesig}</Text>
        <Text style={styles.department} numberOfLines={1}>{empDept}</Text>
        
        <View style={styles.contactRow}>
          <View style={styles.contactItem}>
            <Mail size={12} color={COLORS.textSecondary} />
            <Text style={styles.contactText} numberOfLines={1}>{empEmail}</Text>
          </View>
          <View style={styles.contactItem}>
            <Phone size={12} color={COLORS.textSecondary} />
            <Text style={styles.contactText} numberOfLines={1}>{empPhone}</Text>
          </View>
        </View>
      </View>
      <View style={styles.arrowContainer}>
        <ChevronRight size={20} color={COLORS.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.inputBg,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  designation: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 1,
  },
  department: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  contactText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  arrowContainer: {
    marginLeft: 8,
  },
});
