import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { HRMSContext } from '../../context/HRMSContext';
import { AuthContext } from '../../context/AuthContext';
import { AttendanceBadge } from '../../components/AttendanceBadge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { CustomInput } from '../../components/CustomInput';
import { Clock, MapPin, FileText, CheckCircle2, AlertCircle } from 'lucide-react-native';

export const ClockInScreen = ({ navigation }) => {
  const { profile } = useContext(AuthContext);
  const { clockedIn, toggleClockIn, lastClockInTime } = useContext(HRMSContext);

  const [location, setLocation] = useState('Office - HQ');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      await toggleClockIn(
        profile?.uid || 'emp_001',
        profile?.name || 'Sarah Jenkins',
        location,
        notes
      );
      Alert.alert(
        'Attendance Updated',
        clockedIn ? 'Clocked out successfully!' : 'Clocked in successfully!'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Clock In / Clock Out</Text>
      <Text style={styles.screenSub}>Record daily working hours, location & check-in notes</Text>

      {/* Main Status Display Box */}
      <View style={styles.statusBox}>
        <View style={styles.clockIconCircle}>
          <Clock size={40} color={clockedIn ? '#34d399' : '#38bdf8'} />
        </View>
        <Text style={styles.statusTime}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.statusDate}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>

        <View style={styles.badgeWrapper}>
          <AttendanceBadge status={clockedIn ? 'Present' : 'Absent'} />
        </View>

        {clockedIn && (
          <Text style={styles.clockInMeta}>Clocked in at {lastClockInTime || '09:00 AM'}</Text>
        )}
      </View>

      {/* Location & Notes Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Shift Configuration</Text>

        <Text style={styles.label}>Work Location</Text>
        <View style={styles.locationRow}>
          {['Office - HQ', 'Remote', 'Client Site'].map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[styles.locChip, location === loc && styles.locChipActive]}
              onPress={() => setLocation(loc)}
            >
              <MapPin size={14} color={location === loc ? '#ffffff' : '#94a3b8'} />
              <Text style={[styles.locChipText, location === loc && styles.locChipTextActive]}>
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <CustomInput
          label="Check-in Note (Optional)"
          placeholder="e.g. Working on Q3 mobile release"
          value={notes}
          onChangeText={setNotes}
          icon={FileText}
        />

        <PrimaryButton
          title={clockedIn ? 'Complete & Clock Out' : 'Submit Clock In'}
          onPress={handleAction}
          loading={loading}
          variant={clockedIn ? 'danger' : 'primary'}
          icon={CheckCircle2}
          style={{ marginTop: 12 }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  screenSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 20,
  },
  statusBox: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  clockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 12,
  },
  statusTime: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 1,
  },
  statusDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  badgeWrapper: {
    marginTop: 12,
  },
  clockInMeta: {
    fontSize: 12,
    color: '#34d399',
    marginTop: 8,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  locChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  locChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  locChipTextActive: {
    color: '#ffffff',
  },
});
