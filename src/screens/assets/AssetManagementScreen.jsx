import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { PayrollContext } from '../../context/PayrollContext';
import { HRMSContext } from '../../context/HRMSContext';
import { COLORS } from '../../constants/theme';
import { Package, User, RotateCcw, Plus } from 'lucide-react-native';

import { AuthContext } from '../../context/AuthContext';

export const AssetManagementScreen = () => {
  const { profile } = useContext(AuthContext);
  const { assets, assignAsset, returnAsset } = useContext(PayrollContext);
  const { employees } = useContext(HRMSContext);

  const userRole = profile?.role || profile?.Role || 'Employee';
  const isEmployee = userRole === 'Employee';

  const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
  const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();

  const displayedAssets = isEmployee
    ? (assets || []).filter(a => {
        const aUid = (a.assignedToId || a.employeeId || '').trim().toLowerCase();
        const aName = (a.assignedTo || '').trim().toLowerCase();
        return (profUid && aUid === profUid) || (profName && aName === profName);
      })
    : (assets || []);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAssignConfirm = (emp) => {
    if (selectedAsset) {
      assignAsset(selectedAsset.id, emp.id, emp.name);
      setModalVisible(false);
      Alert.alert("Asset Assigned", `${selectedAsset.name} assigned to ${emp.name}.`);
    }
  };

  const handleReturn = (asset) => {
    Alert.alert(
      "Return Asset",
      `Are you sure you want to mark ${asset.name} as returned to inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Return", onPress: () => returnAsset(asset.id) }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Package size={24} color={COLORS.primary} />
        <Text style={styles.headerTitle}>{isEmployee ? 'My Assigned Assets' : 'Company Asset Management'}</Text>
        <Text style={styles.headerSub}>{isEmployee ? 'Hardware, devices, and peripherals assigned to your account.' : 'Track hardware, laptops, phones, and peripherals assigned to employees.'}</Text>
      </View>

      <Text style={styles.sectionHeader}>{isEmployee ? 'My Active Hardware Assets' : 'Company Asset Directory'} ({displayedAssets.length})</Text>

      {displayedAssets.length === 0 ? (
        <View style={styles.assetCard}>
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginVertical: 12 }}>
            {isEmployee ? 'No company hardware or assets assigned to your account.' : 'No asset records found.'}
          </Text>
        </View>
      ) : (
        displayedAssets.map((asset) => (
          <View key={asset.id} style={styles.assetCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetSub}>{asset.category} • S/N: {asset.serialNumber}</Text>
              </View>

              <View style={[styles.badge, asset.status === 'Assigned' ? styles.badgeAssigned : styles.badgeAvail]}>
                <Text style={[styles.badgeText, asset.status === 'Assigned' ? styles.textAssigned : styles.textAvail]}>
                  {asset.status}
                </Text>
              </View>
            </View>

            <View style={styles.assignedRow}>
              <User size={16} color={COLORS.textSecondary} />
              <Text style={styles.assignedText}>
                Assigned To: <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>{asset.assignedTo}</Text>
                {asset.assignedDate ? ` (${asset.assignedDate})` : ''}
              </Text>
            </View>

            {!isEmployee && (
              <View style={styles.btnRow}>
                {asset.status === 'Available' ? (
                  <TouchableOpacity 
                    style={styles.assignBtn}
                    onPress={() => {
                      setSelectedAsset(asset);
                      setModalVisible(true);
                    }}
                  >
                    <Plus size={16} color="#ffffff" />
                    <Text style={styles.assignBtnText}>Assign to Employee</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.returnBtn}
                    onPress={() => handleReturn(asset)}
                  >
                    <RotateCcw size={16} color={COLORS.danger} />
                    <Text style={styles.returnBtnText}>Return to Inventory</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))
      )}

      {/* Select Employee Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign {selectedAsset?.name}</Text>
            <Text style={styles.modalSub}>Select employee from directory:</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {employees.map((emp) => (
                <TouchableOpacity 
                  key={emp.id} 
                  style={styles.empItem} 
                  onPress={() => handleAssignConfirm(emp)}
                >
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empDept}>{emp.department} • {emp.designation}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  assetCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  assetSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeAssigned: {
    backgroundColor: 'rgba(241, 94, 140, 0.12)',
  },
  badgeAvail: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textAssigned: {
    color: COLORS.primary,
  },
  textAvail: {
    color: COLORS.success,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  assignedText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  btnRow: {
    alignItems: 'flex-end',
  },
  assignBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  },
  returnBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: 6,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(63, 71, 82, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  empItem: {
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  empDept: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  closeText: {
    color: COLORS.textSecondary,
  },
});
