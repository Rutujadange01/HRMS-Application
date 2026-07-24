import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS } from '../constants/theme';

export const PrimaryButton = ({ title, onPress, loading, variant = 'primary', icon: Icon, style, textStyle }) => {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';

  const getBackgroundColor = () => {
    if (isPrimary) return COLORS.primary;
    if (isDanger) return COLORS.danger;
    if (isOutline) return 'transparent';
    return COLORS.textSecondary;
  };

  const getTextColor = () => {
    if (isOutline) return COLORS.primary;
    return '#ffffff';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: isOutline ? COLORS.primary : 'transparent',
          borderWidth: isOutline ? 1.5 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.contentRow}>
          {Icon && <Icon size={18} color={getTextColor()} style={{ marginRight: 8 }} />}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
  },
});
