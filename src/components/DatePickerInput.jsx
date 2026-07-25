import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check, Clock } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DatePickerInput = ({
  label,
  value = '',
  onChangeText,
  onDateChange,
  placeholder = 'YYYY-MM-DD',
  icon: Icon = CalendarIcon,
  error,
  containerStyle
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Parse initial date or default to current date
  const parseInitialDate = (val) => {
    if (val && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
      const parts = val.trim().split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return { year: y, month: m, day: d };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  };

  const initial = parseInitialDate(value);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [selectedDateStr, setSelectedDateStr] = useState(value || '');

  const openPicker = () => {
    const cur = parseInitialDate(value);
    setViewYear(cur.year);
    setViewMonth(cur.month);
    setSelectedDateStr(value || '');
    setShowYearPicker(false);
    setModalVisible(true);
  };

  const handleDateSelect = (dayNum) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const dateStr = `${viewYear}-${mm}-${dd}`;
    setSelectedDateStr(dateStr);
  };

  const handleConfirm = () => {
    let finalStr = selectedDateStr;
    if (!finalStr) {
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(1).padStart(2, '0');
      finalStr = `${viewYear}-${mm}-${dd}`;
    }
    if (onChangeText) onChangeText(finalStr);
    if (onDateChange) onDateChange(finalStr);
    setModalVisible(false);
  };

  const handleQuickPreset = (presetType) => {
    const today = new Date();
    let target = new Date();

    if (presetType === 'today') {
      target = today;
    } else if (presetType === 'yesterday') {
      target.setDate(today.getDate() - 1);
    } else if (presetType === '1yr_ago') {
      target.setFullYear(today.getFullYear() - 1);
    } else if (presetType === '18yrs_ago') {
      target.setFullYear(today.getFullYear() - 18);
    } else if (presetType === '25yrs_ago') {
      target.setFullYear(today.getFullYear() - 25);
    }

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    setViewYear(yyyy);
    setViewMonth(target.getMonth());
    setSelectedDateStr(dateStr);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calendar Grid Math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0 .. Sun=6

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  // Years range 1945 to 2035 for quick year selection
  const yearsList = [];
  for (let y = 2035; y >= 1945; y--) {
    yearsList.push(y);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={[styles.inputWrapper, error && styles.inputError]} 
        onPress={openPicker}
        activeOpacity={0.8}
      >
        <Icon size={18} color={COLORS.primary} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(txt) => {
            if (onChangeText) onChangeText(txt);
            if (onDateChange) onDateChange(txt);
          }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          editable={true}
        />
        <TouchableOpacity style={styles.pickerBtn} onPress={openPicker}>
          <CalendarIcon size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Calendar Picker Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.calendarCard}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CalendarIcon size={20} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Select Date</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} padding={4}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset('today')}>
                <Text style={styles.presetText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset('yesterday')}>
                <Text style={styles.presetText}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset('1yr_ago')}>
                <Text style={styles.presetText}>1 Yr Ago</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset('18yrs_ago')}>
                <Text style={styles.presetText}>18 Yrs Ago</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetChip} onPress={() => handleQuickPreset('25yrs_ago')}>
                <Text style={styles.presetText}>25 Yrs Ago</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Month & Year Controller Header */}
            <View style={styles.monthHeader}>
              <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
                <ChevronLeft size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.monthYearSelector} onPress={() => setShowYearPicker(!showYearPicker)}>
                <Text style={styles.monthYearText}>
                  {MONTH_NAMES[viewMonth]} <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{viewYear}</Text>
                </Text>
                <Text style={styles.yearDropdownHint}>{showYearPicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
                <ChevronRight size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Year Selector Dropdown Modal View */}
            {showYearPicker ? (
              <View style={styles.yearPickerBox}>
                <Text style={styles.yearPickerHeader}>Select Year ({viewYear}):</Text>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
                  <View style={styles.yearsGrid}>
                    {yearsList.map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[styles.yearItem, viewYear === y && styles.yearItemActive]}
                        onPress={() => {
                          setViewYear(y);
                          setShowYearPicker(false);
                        }}
                      >
                        <Text style={[styles.yearItemText, viewYear === y && styles.yearItemTextActive]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <>
                {/* Weekday Badges */}
                <View style={styles.weekdayRow}>
                  {WEEKDAYS.map((day) => (
                    <Text key={day} style={styles.weekdayText}>{day}</Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {/* Empty slots for month start offset */}
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <View key={`empty-${idx}`} style={styles.dayCellEmpty} />
                  ))}

                  {/* Days of month */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const mm = String(viewMonth + 1).padStart(2, '0');
                    const dd = String(dayNum).padStart(2, '0');
                    const cellDateStr = `${viewYear}-${mm}-${dd}`;

                    const isSelected = selectedDateStr === cellDateStr;
                    const isToday = todayStr === cellDateStr;

                    return (
                      <TouchableOpacity
                        key={dayNum}
                        style={[
                          styles.dayCell,
                          isToday && styles.dayCellToday,
                          isSelected && styles.dayCellSelected,
                        ]}
                        onPress={() => handleDateSelect(dayNum)}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            isToday && styles.dayCellTextToday,
                            isSelected && styles.dayCellTextSelected,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Selected Date Indicator */}
            <View style={styles.selectedDisplayRow}>
              <Clock size={16} color={COLORS.textSecondary} />
              <Text style={styles.selectedDisplayText}>
                Selected: <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{selectedDateStr || 'None'}</Text>
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Check size={16} color="#ffffff" />
                <Text style={styles.confirmText}>Set Date</Text>
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
  inputError: {
    borderColor: COLORS.danger,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  pickerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(241, 94, 140, 0.08)',
  },
  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 6,
  },
  navBtn: {
    padding: 6,
  },
  monthYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  yearDropdownHint: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  yearPickerBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  yearPickerHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  yearItem: {
    width: 60,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  yearItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yearItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  yearItemTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  weekdayRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  dayCellTextToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayCellTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  selectedDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.inputBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  selectedDisplayText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
