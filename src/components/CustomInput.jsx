import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  icon: Icon,
  error,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper, 
        multiline && styles.multilineWrapper, 
        error && styles.inputError,
        style
      ]}>
        {Icon && <Icon size={18} color={COLORS.textSecondary} style={[styles.icon, multiline && styles.multilineIcon]} />}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 48,
  },
  multilineWrapper: {
    height: 'auto',
    minHeight: 90,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  icon: {
    marginRight: 10,
  },
  multilineIcon: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 4,
  },
});
