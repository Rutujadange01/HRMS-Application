import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { HRMSContext } from '../context/HRMSContext';
import { COLORS } from '../constants/theme';
import { XCircle, Clock } from 'lucide-react-native';

export const FacePunchModal = ({ visible, onClose }) => {
  const { profile, user } = useContext(AuthContext);
  const { toggleClockIn, clockedIn, employees } = useContext(HRMSContext);

  const [punchType, setPunchType] = useState('In'); // In | Out

  useEffect(() => {
    if (visible) {
      setPunchType(clockedIn ? 'Out' : 'In');
    }
  }, [visible, clockedIn]);

  const matchedEmp = React.useMemo(() => {
    if (!employees || employees.length === 0) return null;
    const profUid = (profile?.uid || profile?.UserID || profile?.id || '').trim().toLowerCase();
    const profEmail = (profile?.email || profile?.Email || '').trim().toLowerCase();
    const profName = (profile?.name || profile?.FullName || '').trim().toLowerCase();

    return employees.find(e => {
      const eUid = (e.id || e.UserID || '').trim().toLowerCase();
      const eEmail = (e.Email || e.email || '').trim().toLowerCase();
      const eName = (e.FullName || e.name || '').trim().toLowerCase();
      return (profUid && eUid === profUid) || (profEmail && eEmail === profEmail) || (profName && eName === profName);
    });
  }, [employees, profile]);

  const userName = matchedEmp?.FullName || matchedEmp?.name || profile?.name || profile?.FullName || user?.displayName || 'Employee';
  const userId = matchedEmp?.UserID || matchedEmp?.id || profile?.uid || profile?.UserID || 'emp_001';

  const handleConfirmPunch = async () => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const punchEmp = matchedEmp || profile;
      const punchEmpId = punchEmp?.UserID || punchEmp?.id || userId;
      const punchEmpName = punchEmp?.FullName || punchEmp?.name || userName;

      const methodText = `Standard Punch ${punchType} at ${timeStr}`;
      
      if (toggleClockIn) {
        await toggleClockIn(punchEmpId, punchEmpName, methodText);
      }

      Alert.alert(
        `Punched ${punchType} Successfully! ✅`,
        `${punchEmpName} has punched ${punchType.toLowerCase()} at ${timeStr}.`
      );
      
      onClose();
    } catch (error) {
      console.error("Punch error:", error);
      Alert.alert("Punch Failed", "Could not record attendance. Please try again.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.fullScreenContainer} edges={['top', 'bottom']}>
        <View style={styles.contentWrapper}>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Attendance Punch</Text>
              <Text style={styles.subText}>Select punch type to record attendance</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Type Selector */}
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[styles.typeChip, punchType === 'In' && styles.typeChipInActive]}
              onPress={() => setPunchType('In')}
            >
              <Text style={[styles.typeChipText, punchType === 'In' && styles.typeChipTextActive]}>
                Punch IN
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.typeChip, punchType === 'Out' && styles.typeChipOutActive]}
              onPress={() => setPunchType('Out')}
            >
              <Text style={[styles.typeChipText, punchType === 'Out' && styles.typeChipTextActive]}>
                Punch OUT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.punchButton,
                punchType === 'In' ? styles.punchInButton : styles.punchOutButton
              ]}
              onPress={handleConfirmPunch}
            >
              <View style={styles.punchBtnContent}>
                <Clock size={20} color="#fff" />
                <Text style={styles.punchButtonText}>
                  Confirm Punch {punchType}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  contentWrapper: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 30,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipInActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  typeChipOutActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeChipTextActive: {
    color: '#ffffff',
  },
  actionsContainer: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 20,
    gap: 12,
  },
  punchButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  punchInButton: {
    backgroundColor: COLORS.success,
  },
  punchOutButton: {
    backgroundColor: COLORS.secondary,
  },
  punchBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  punchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
