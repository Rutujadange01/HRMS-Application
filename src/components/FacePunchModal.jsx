import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { HRMSContext } from '../context/HRMSContext';
import { COLORS } from '../constants/theme';
import { XCircle } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';

export const FacePunchModal = ({ visible, onClose }) => {
  const { profile, user } = useContext(AuthContext);
  const { toggleClockIn, clockedIn, employees, company } = useContext(HRMSContext);

  const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371000;
    const dLat = (parseFloat(lat2) - parseFloat(lat1)) * (Math.PI / 180);
    const dLon = (parseFloat(lon2) - parseFloat(lon1)) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(parseFloat(lat1) * (Math.PI / 180)) *
        Math.cos(parseFloat(lat2) * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const [punchType, setPunchType] = useState('In'); // In | Out
  const [isPunching, setIsPunching] = useState(false);

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

  const executePunch = async (locationData = null, methodUsed = 'Biometric') => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const punchEmp = matchedEmp || profile;
      const punchEmpId = punchEmp?.UserID || punchEmp?.id || userId;
      const punchEmpName = punchEmp?.FullName || punchEmp?.name || userName;

      let methodText = `${methodUsed} Punch ${punchType} at ${timeStr}`;
      
      let userCoords = null;
      if (locationData) {
        userCoords = {
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude
        };
        methodText += ` (Location captured)`;
      }
      
      if (toggleClockIn) {
        await toggleClockIn(punchEmpId, punchEmpName, methodText, '', punchType.toLowerCase(), userCoords);
      }

      Alert.alert(
        `Punched ${punchType} Successfully! ✅`,
        `${punchEmpName} has punched ${punchType.toLowerCase()} at ${timeStr}.`
      );
      
      onClose();
    } catch (error) {
      console.error("Punch error:", error);
      Alert.alert("Punch Failed", "Could not record attendance. Please try again.");
    } finally {
      setIsPunching(false);
    }
  };

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
         Alert.alert("Location Required", "Please allow location access to punch in.");
         setIsPunching(false);
         return null;
      }

      // Try fetching the last known position first (super fast)
      let locationData = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
      
      if (!locationData) {
        // Fallback to current position if no recent location is available
        locationData = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      return locationData;
    } catch (locErr) {
       console.error("Location error:", locErr);
       Alert.alert("Location Error", "Could not fetch GPS location. Make sure Location Services are enabled.");
       setIsPunching(false);
       return null;
    }
  };

  const handleConfirmPunch = async (method) => {
    if (isPunching) return;
    try {
      setIsPunching(true);

      const isGeoRequired = Boolean(company?.GeoFenceRequired ?? true);
      const maxRadius = parseFloat(company?.GeoFenceRadius || '0');
      let loc = null;

      // 1. FIRST: Validate Geofence (if required) BEFORE biometric prompt
      if (isGeoRequired && maxRadius > 0) {
        loc = await fetchLocation();
        if (!loc) {
          // fetchLocation handles alerts internally
          return;
        }

        const compLat = company?.Latitude || '37.7749';
        const compLon = company?.Longitude || '-122.4194';
        const userLat = loc.coords.latitude;
        const userLon = loc.coords.longitude;
        const compLocationName = company?.Location || 'Office';

        const distMeters = calculateDistanceMeters(compLat, compLon, userLat, userLon);
        
        if (distMeters > maxRadius) {
          setIsPunching(false);
          Alert.alert(
            "Geofence Violation",
            `You are ${distMeters}m away from ${compLocationName}. Max allowed radius is ${maxRadius}m. You cannot punch in.`
          );
          return;
        }
      }

      const openSettings = () => {
        if (Platform.OS === 'ios') {
          Linking.openSettings();
        } else if (Platform.OS === 'android') {
          Linking.sendIntent('android.settings.SECURITY_SETTINGS');
        }
        onClose();
      };

      // 2. Bypass Biometrics entirely if running in a Web Browser
      if (Platform.OS === 'web') {
        // Biometrics are not supported on web. Just punch them in directly.
        await executePunch(loc, 'Web-Bypass');
        return;
      }

      // 3. Check if user has ANY screen lock / biometrics saved (Native Apps only)
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        setIsPunching(false);
        Alert.alert(
          `Biometrics Not Set Up`,
          `You haven't set up Biometrics on your mobile device. Please go to settings to set it up.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openSettings }
          ]
        );
        return;
      }

      // 4. Authenticate with OS Native Prompt
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: `Verify your Identity for Punch ${punchType}`,
        cancelLabel: "Cancel",
        disableDeviceFallback: false, // Allow fallback to PIN
      });

      // 4. Success / Fail Logic
      if (authResult.success) {
        await executePunch(loc, 'Biometric');
      } else {
        setIsPunching(false);
        if (authResult.error !== 'user_cancel' && authResult.error !== 'app_cancel') {
           Alert.alert("Authentication Failed", "Biometric authentication failed.");
        }
      }
    } catch (error) {
      setIsPunching(false);
      console.error("Biometric auth error:", error);
      Alert.alert("Error", "An unexpected error occurred during authentication.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.fullScreenContainer} edges={['top', 'bottom']}>
        <View style={styles.contentWrapper}>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Punch {punchType.toUpperCase()}</Text>
              <Text style={styles.subText}>Please verify your identity to record attendance</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1, minHeight: 40 }} />

          {/* Execution Buttons (Auth Method) */}
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeChip, 
                styles.punchInButton,
                isPunching && { opacity: 0.7 }
              ]}
              onPress={() => handleConfirmPunch('Biometric')}
              disabled={isPunching}
            >
              {isPunching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.typeChipText, { color: '#fff', fontWeight: '700' }]}>
                  Verify Identity
                </Text>
              )}
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
    minHeight: 250,
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
    marginBottom: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  punchInButton: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  typeChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  }
});
