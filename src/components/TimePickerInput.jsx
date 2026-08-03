import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { Clock as ClockIcon, Check, X } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

const parseTimeValue = (value) => {
  if (typeof value === 'string' && value.trim()) {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      return { hour, minute, period };
    }
  }

  const now = new Date();
  return {
    hour: now.getHours() % 12 || 12,
    minute: now.getMinutes(),
    period: now.getHours() >= 12 ? 'PM' : 'AM'
  };
};

const formatTimeValue = ({ hour, minute, period }) => {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
};

export const TimePickerInput = ({
  label,
  value = '',
  onChangeText,
  onTimeChange,
  placeholder = '09:00 AM',
  error,
  containerStyle
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const initialTime = useMemo(() => parseTimeValue(value), [value]);
  const [selectedHour, setSelectedHour] = useState(initialTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialTime.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(initialTime.period);

  const openPicker = () => {
    const parsed = parseTimeValue(value);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
    setModalVisible(true);
  };

  const handleConfirm = () => {
    const timeStr = formatTimeValue({
      hour: selectedHour,
      minute: selectedMinute,
      period: selectedPeriod
    });

    if (onChangeText) onChangeText(timeStr);
    if (onTimeChange) onTimeChange(timeStr);
    setModalVisible(false);
  };

  const hours = Array.from({ length: 12 }, (_, index) => index + 1);
  const minutes = Array.from({ length: 60 }, (_, index) => index);
  const periods = ['AM', 'PM'];

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity style={[styles.inputWrapper, error && styles.inputError]} onPress={openPicker} activeOpacity={0.9}>
        <ClockIcon size={18} color={COLORS.primary} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(txt) => {
            if (onChangeText) onChangeText(txt);
            if (onTimeChange) onTimeChange(txt);
          }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          editable={true}
        />
        <TouchableOpacity style={styles.pickerBtn} onPress={openPicker}>
          <ClockIcon size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.timeCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ClockIcon size={20} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Select Time</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={`hour-${hour}`}
                      style={[styles.optionItem, selectedHour === hour && styles.optionItemActive]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text style={[styles.optionText, selectedHour === hour && styles.optionTextActive]}>{String(hour).padStart(2, '0')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minute</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[styles.optionItem, selectedMinute === minute && styles.optionItemActive]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text style={[styles.optionText, selectedMinute === minute && styles.optionTextActive]}>{String(minute).padStart(2, '0')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>AM/PM</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {periods.map((period) => (
                    <TouchableOpacity
                      key={period}
                      style={[styles.optionItem, selectedPeriod === period && styles.optionItemActive]}
                      onPress={() => setSelectedPeriod(period)}
                    >
                      <Text style={[styles.optionText, selectedPeriod === period && styles.optionTextActive]}>{period}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.selectedRow}>
              <Text style={styles.selectedText}>Selected: </Text>
              <Text style={styles.selectedValue}>{formatTimeValue({ hour: selectedHour, minute: selectedMinute, period: selectedPeriod })}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Check size={16} color="#ffffff" />
                <Text style={styles.confirmText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 48
  },
  inputError: {
    borderColor: COLORS.danger
  },
  icon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14
  },
  pickerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(241, 94, 140, 0.08)'
  },
  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 4
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  timeCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 18
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 6
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center'
  },
  pickerScroll: {
    maxHeight: 180,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingVertical: 4
  },
  optionItem: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 6,
    marginVertical: 2
  },
  optionItemActive: {
    backgroundColor: COLORS.primary
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  optionTextActive: {
    color: '#ffffff'
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  selectedText: {
    fontSize: 13,
    color: COLORS.textSecondary
  },
  selectedValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: '700',
    marginLeft: 6
  }
});
