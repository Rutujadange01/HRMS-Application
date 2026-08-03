import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export const StatCard = ({ title, value, subtitle, color = COLORS.primary, icon: Icon }) => {
  const strVal = String(value || '');
  const isLongValue = strVal.length > 8;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
        {Icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Icon size={16} color={color} />
          </View>
        )}
      </View>
      <Text 
        style={[styles.value, { color, fontSize: isLongValue ? 16 : 22 }]} 
        numberOfLines={1} 
        adjustsFontSizeToFit
      >
        {strVal}
      </Text>
      {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    minWidth: 130,
    margin: 4,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    marginRight: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  iconContainer: {
    padding: 6,
    borderRadius: 8,
  },
  value: {
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
