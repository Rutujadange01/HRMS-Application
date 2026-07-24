import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { AttendanceBadge } from './AttendanceBadge';
import { COLORS } from '../constants/theme';
import { Mail, Phone, ChevronRight } from 'lucide-react-native';

export const EmployeeCard = ({ employee, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image
        source={{ uri: employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
        style={styles.avatar}
      />
      <View style={styles.infoContainer}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{employee.name}</Text>
          <AttendanceBadge status={employee.status} />
        </View>
        <Text style={styles.designation}>{employee.designation}</Text>
        <Text style={styles.department}>{employee.department}</Text>
        
        <View style={styles.contactRow}>
          <View style={styles.contactItem}>
            <Mail size={12} color={COLORS.textSecondary} />
            <Text style={styles.contactText} numberOfLines={1}>{employee.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <Phone size={12} color={COLORS.textSecondary} />
            <Text style={styles.contactText}>{employee.phone}</Text>
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
    marginRight: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  designation: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  department: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  arrowContainer: {
    paddingLeft: 8,
  },
});
