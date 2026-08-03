import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export const AttendanceBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      case 'present':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: '#10b981' };
      case 'late':
        return { bg: 'rgba(253, 172, 100, 0.2)', text: '#d97706', border: '#fdac64' };
      case 'absent':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: '#ef4444' };
      case 'approved':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: '#10b981' };
      case 'pending':
        return { bg: 'rgba(241, 94, 140, 0.12)', text: '#f15e8c', border: '#f15e8c' };
      case 'on leave':
        return { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6', border: '#8b5cf6' };
      case 'no punch':
      case 'no record':
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#64748b', border: '#cbd5e1' };
      default:
        return { bg: 'rgba(108, 117, 125, 0.12)', text: '#6c757d', border: '#e2e8f0' };
    }
  };

  const style = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.badgeText, { color: style.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
