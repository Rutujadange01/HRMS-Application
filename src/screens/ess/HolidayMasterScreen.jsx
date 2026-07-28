import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { holidayService } from '../../services/holidayService';
import { HRMSContext } from '../../context/HRMSContext';
import { COLORS } from '../../constants/theme';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react-native';

export const HolidayMasterScreen = ({ navigation }) => {
  const { profile } = useContext(HRMSContext);
  const companyId = profile?.CompanyID || '';

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [form, setForm] = useState({
    HolidayID: '',
    HolidayName: '',
    CompanyID: companyId,
    HolidayDate: new Date().toISOString(),
    Description: '',
    IsActive: true,
    CreatedByUId: profile?.uid || profile?.UserID || '',
    CreatedDate: '',
    UpdatedByUId: '',
    UpdatedDate: '',
  });

  useEffect(() => {
    const unsub = holidayService.subscribeHolidays(companyId, data => {
      setHolidays(data);
      setLoading(false);
    });
    return () => unsub();
  }, [companyId]);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        HolidayID: item.HolidayID || '',
        HolidayName: item.HolidayName || '',
        CompanyID: item.CompanyID || companyId,
        HolidayDate: item.HolidayDate || new Date().toISOString(),
        Description: item.Description || '',
        IsActive: !!item.IsActive,
        CreatedByUId: item.CreatedByUId || '',
        CreatedDate: item.CreatedDate || '',
        UpdatedByUId: item.UpdatedByUId || '',
        UpdatedDate: item.UpdatedDate || '',
      });
    } else {
      setEditingItem(null);
      setForm({
        HolidayID: '',
        HolidayName: '',
        CompanyID: companyId,
        HolidayDate: new Date().toISOString(),
        Description: '',
        IsActive: true,
        CreatedByUId: profile?.uid || profile?.UserID || '',
        CreatedDate: '',
        UpdatedByUId: '',
        UpdatedDate: '',
      });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.HolidayName) {
      Alert.alert('Validation', 'Holiday name is required');
      return;
    }
    try {
      if (editingItem) {
        await holidayService.updateHoliday(form.HolidayID, {
          HolidayName: form.HolidayName,
          HolidayDate: form.HolidayDate,
          Description: form.Description,
          IsActive: form.IsActive,
          UpdatedByUId: profile?.uid || profile?.UserID || '',
        });
      } else {
        await holidayService.addHoliday({
          HolidayName: form.HolidayName,
          CompanyID: form.CompanyID,
          HolidayDate: form.HolidayDate,
          Description: form.Description,
          IsActive: form.IsActive,
          CreatedByUId: form.CreatedByUId,
        });
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save holiday');
    }
  };

  const handleDelete = async holidayId => {
    Alert.alert('Confirm Delete', 'Delete this holiday?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await holidayService.deleteHoliday(holidayId);
          } catch (e) {
            Alert.alert('Error', e.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.title}>{item.HolidayName}</Text>
        <Text style={styles.date}>{new Date(item.HolidayDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
        {item.Description ? <Text style={styles.desc}>{item.Description}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
          <Edit2 size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.HolidayID)} style={styles.actionBtn}>
          <Trash2 size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={holidays}
        keyExtractor={item => item.HolidayID}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No holidays defined.</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Holiday' : 'Add Holiday'}</Text>
            
            <TextInput
              placeholder="Holiday Name"
              value={form.HolidayName}
              onChangeText={val => setForm({ ...form, HolidayName: val })}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={() => {
                // TODO: invoke native date picker – left as placeholder for brevity
              }}
              style={styles.datePickerBtn}
            >
              <Calendar size={16} color={COLORS.textSecondary} />
              <Text style={styles.datePickerText}>Select Date</Text>
            </TouchableOpacity>
            <TextInput
              placeholder="Description (optional)"
              value={form.Description}
              onChangeText={val => setForm({ ...form, Description: val })}
              style={styles.input}
            />



            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  desc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  badgeContainer: { marginTop: 6 },
  badgeActive: { backgroundColor: '#bbf7d0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeInactive: { backgroundColor: '#fca5a5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#065f46' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 6 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', maxWidth: 380, backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.inputBg, borderRadius: 8, padding: 10, marginBottom: 12, color: COLORS.textPrimary },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  datePickerText: { marginLeft: 8, color: COLORS.textPrimary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  switchLabel: { fontSize: 14, color: COLORS.textPrimary },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fieldLabel: { fontSize: 13, color: COLORS.textSecondary },
  fieldValue: { fontSize: 13, color: COLORS.textPrimary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  cancelText: { color: COLORS.textSecondary },
  saveBtn: { backgroundColor: COLORS.success, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  saveText: { color: '#fff', fontWeight: '600' },
});
