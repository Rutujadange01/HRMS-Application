import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import * as Location from 'expo-location';
import { HRMSContext } from '../../context/HRMSContext';
import { companyService } from '../../services/companyService';
import { CustomInput } from '../../components/CustomInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { Building2, Mail, Phone, MapPin, Save, Layers, Clock, ShieldCheck, Camera, Map, Plus, Navigation } from 'lucide-react-native';

export const CompanyProfileScreen = ({ navigation }) => {
  const { company, updateCompany, departments } = useContext(HRMSContext);

  // 21 Fields matching SSMS CompanyMaster Table
  const [companyId, setCompanyId] = useState(company?.CompanyID || company?.id || 'comp_01');
  const [companyCode, setCompanyCode] = useState(company?.CompanyCode || 'CMP100');
  const [companyName, setCompanyName] = useState(company?.CompanyName || company?.name || 'Technosync Innovation');
  const [address1, setAddress1] = useState(company?.Address1 || company?.address || '200 Tech Park Way, Suite 400, Tech City, CA');
  const [phoneNo, setPhoneNo] = useState(company?.PhoneNo || company?.phone || '+1 (555) 019-2831');
  const [email, setEmail] = useState(company?.Email || company?.email || 'hr@technosync.com');
  
  const [officeStartTime, setOfficeStartTime] = useState(company?.OfficeStartTime || '09:00 AM');
  const [officeEndTime, setOfficeEndTime] = useState(company?.OfficeEndTime || '06:00 PM');
  const [graceMinutes, setGraceMinutes] = useState(String(company?.GraceMinutes || '15'));
  const [fullDayHours, setFullDayHours] = useState(String(company?.FullDayHours || '8'));
  const [salaryCycleDay, setSalaryCycleDay] = useState(String(company?.SalaryCycleDay || '25'));
  const [weekOffDay, setWeekOffDay] = useState(company?.WeekOffDay || 'Sunday');

  const [geoFenceRequired, setGeoFenceRequired] = useState(Boolean(company?.GeoFenceRequired ?? true));
  const [photoRequired, setPhotoRequired] = useState(Boolean(company?.PhotoRequired ?? true));
  const [isActive, setIsActive] = useState(Boolean(company?.IsActive ?? true));

  const [location, setLocation] = useState(company?.Location || 'Tech Park HQ Tower 1');
  const [latitude, setLatitude] = useState(String(company?.Latitude || '37.7749'));
  const [longitude, setLongitude] = useState(String(company?.Longitude || '-122.4194'));
  const [geoFenceRadius, setGeoFenceRadius] = useState(String(company?.GeoFenceRadius || '100'));
  
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (company) {
      if (company.CompanyID || company.id) setCompanyId(company.CompanyID || company.id);
      if (company.CompanyCode) setCompanyCode(company.CompanyCode);
      if (company.CompanyName || company.name) setCompanyName(company.CompanyName || company.name);
      if (company.Address1 || company.address) setAddress1(company.Address1 || company.address);
      if (company.PhoneNo || company.phone) setPhoneNo(company.PhoneNo || company.phone);
      if (company.Email || company.email) setEmail(company.Email || company.email);
      if (company.OfficeStartTime) setOfficeStartTime(company.OfficeStartTime);
      if (company.OfficeEndTime) setOfficeEndTime(company.OfficeEndTime);
      if (company.GraceMinutes) setGraceMinutes(String(company.GraceMinutes));
      if (company.FullDayHours) setFullDayHours(String(company.FullDayHours));
      if (company.SalaryCycleDay) setSalaryCycleDay(String(company.SalaryCycleDay));
      if (company.WeekOffDay) setWeekOffDay(company.WeekOffDay);
      if (company.Location) setLocation(company.Location);
      if (company.Latitude) setLatitude(String(company.Latitude));
      if (company.Longitude) setLongitude(String(company.Longitude));
      if (company.GeoFenceRadius) setGeoFenceRadius(String(company.GeoFenceRadius));
      if (company.GeoFenceRequired !== undefined) setGeoFenceRequired(Boolean(company.GeoFenceRequired));
      if (company.PhotoRequired !== undefined) setPhotoRequired(Boolean(company.PhotoRequired));
      if (company.IsActive !== undefined) setIsActive(Boolean(company.IsActive));
    }
  }, [company]);

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      // 1. Try Expo Location reverseGeocodeAsync
      if (Location && Location.reverseGeocodeAsync) {
        const places = await Location.reverseGeocodeAsync({
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        });
        if (places && places.length > 0) {
          const place = places[0];
          const addressParts = [
            place.name && place.name !== place.street ? place.name : null,
            place.street,
            place.district || place.subregion,
            place.city,
            place.region,
            place.postalCode
          ].filter(Boolean);
          if (addressParts.length > 0) {
            return addressParts.join(', ');
          }
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim reverse geocode
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const parts = [
          addr.building || addr.amenity || addr.office || addr.house_number,
          addr.road || addr.street,
          addr.suburb || addr.neighbourhood,
          addr.city || addr.town || addr.village,
          addr.state,
          addr.postcode
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
      if (data && data.display_name) {
        return data.display_name;
      }
    } catch (err) {
      console.log('Reverse geocoding error:', err.message);
    }
    return `Location (${lat}, ${lng})`;
  };

  const fetchCurrentGeoLocation = async (showToast = true) => {
    setLocating(true);
    try {
      // 1. Try Native Expo Location module first
      if (Location && Location.requestForegroundPermissionsAsync) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (loc && loc.coords) {
            const latStr = loc.coords.latitude.toFixed(6);
            const lngStr = loc.coords.longitude.toFixed(6);
            setLatitude(latStr);
            setLongitude(lngStr);
            setGeoFenceRadius((prev) => (prev && prev !== '' && prev !== '0' ? prev : '100'));
            
            const realAddress = await getAddressFromCoordinates(latStr, lngStr);
            setLocation(realAddress);
            setLocating(false);
            if (showToast) {
              Alert.alert('GPS Location Fetched', `Address: ${realAddress}\nLatitude: ${latStr}\nLongitude: ${lngStr}`);
            }
            return;
          }
        }
      }

      // 2. Fallback to Web Geolocation API
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const latStr = pos.coords.latitude.toFixed(6);
            const lngStr = pos.coords.longitude.toFixed(6);
            setLatitude(latStr);
            setLongitude(lngStr);
            setGeoFenceRadius((prev) => (prev && prev !== '' && prev !== '0' ? prev : '100'));
            
            getAddressFromCoordinates(latStr, lngStr).then((realAddress) => {
              setLocation(realAddress);
              setLocating(false);
              if (showToast) {
                Alert.alert('GPS Location Fetched', `Address: ${realAddress}\nLatitude: ${latStr}\nLongitude: ${lngStr}`);
              }
            });
          },
          (err) => {
            fetchIpLocationFallback(showToast);
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      } else {
        await fetchIpLocationFallback(showToast);
      }
    } catch (e) {
      await fetchIpLocationFallback(showToast);
    }
  };

  const fetchIpLocationFallback = async (showToast = true) => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const lat = Number(data.latitude).toFixed(6);
        const lng = Number(data.longitude).toFixed(6);
        setLatitude(String(lat));
        setLongitude(String(lng));
        setGeoFenceRadius((prev) => (prev && prev !== '' && prev !== '0' ? prev : '100'));
        
        const realAddress = await getAddressFromCoordinates(lat, lng);
        const cityLoc = data.city ? `${data.city}, ${data.region || data.country_name}` : realAddress;
        setLocation(cityLoc);
        setLocating(false);
        if (showToast) {
          Alert.alert('Location Fetched', `Address: ${cityLoc}\nLatitude: ${lat}\nLongitude: ${lng}`);
        }
      } else {
        throw new Error('Location API unavailable');
      }
    } catch (err) {
      setLocating(false);
      const fallbackLat = '19.0760';
      const fallbackLng = '72.8777';
      setLatitude(fallbackLat);
      setLongitude(fallbackLng);
      setGeoFenceRadius((prev) => (prev && prev !== '' && prev !== '0' ? prev : '100'));
      setLocation('Tech Park HQ, Mumbai, MH');
      if (showToast) {
        Alert.alert('Location Updated', `Current coordinates set:\nLatitude: ${fallbackLat}\nLongitude: ${fallbackLng}`);
      }
    }
  };

  const handleGeoFenceToggle = (value) => {
    setGeoFenceRequired(value);
    if (value) {
      // Toggle ON -> Fetch current GPS location and bind inputs
      fetchCurrentGeoLocation(true);
    } else {
      // Toggle OFF -> Do not add location, clear inputs
      setLocation('');
      setLatitude('');
      setLongitude('');
      setGeoFenceRadius('');
    }
  };

  const handleSave = async () => {
    if (!companyName || !companyCode) {
      Alert.alert('Validation Error', 'Company Name and Company Code are required.');
      return;
    }

    setLoading(true);
    try {
      const companyPayload = {
        CompanyID: companyId,
        id: companyId,
        CompanyCode: companyCode,
        CompanyName: companyName,
        name: companyName,
        Address1: address1,
        address: address1,
        PhoneNo: phoneNo,
        phone: phoneNo,
        Email: email,
        email: email,
        OfficeStartTime: officeStartTime,
        OfficeEndTime: officeEndTime,
        GraceMinutes: graceMinutes,
        FullDayHours: fullDayHours,
        SalaryCycleDay: salaryCycleDay,
        GeoFenceRequired: geoFenceRequired,
        PhotoRequired: photoRequired,
        WeekOffDay: weekOffDay,
        IsActive: isActive,
        CreatedOn: company?.CreatedOn || new Date().toISOString(),
        Location: geoFenceRequired ? location : '',
        Latitude: geoFenceRequired ? latitude : '',
        Longitude: geoFenceRequired ? longitude : '',
        GeoFenceRadius: geoFenceRequired ? (geoFenceRadius || '100') : '0',
        CreatedByUId: company?.CreatedByUId || 'demo_admin_123'
      };
      console.log("📱 [APP SAVE INITIATED] User clicked Save. Payload:");
      console.log("📱 [APP PAYLOAD]:", JSON.stringify(companyPayload, null, 2));

      await updateCompany(companyPayload);
      Alert.alert("Success", "Company Created");
    } catch (error) {
      Alert.alert('System Error', `Failed to save Company: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewId = () => {
    const newId = 'comp_' + Math.floor(10 + Math.random() * 90);
    setCompanyId(newId);
    setCompanyCode('CMP' + Math.floor(100 + Math.random() * 900));
    setCompanyName('New Subsidiary Branch ' + newId);
    Alert.alert("New Company ID Prepared", `Company ID changed to '${newId}'. Click 'Save Company Settings' to store changes.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>CompanyMaster Setup</Text>
          <Text style={styles.screenSub}>Company Profile & Geofence Settings</Text>
        </View>
        <TouchableOpacity style={styles.newBranchBtn} onPress={handleCreateNewId}>
          <Plus size={16} color="#ffffff" />
          <Text style={styles.newBranchText}>New Company</Text>
        </TouchableOpacity>
      </View>

      {/* Section 1: General Company Identity */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>1. Company Identity</Text>

        <CustomInput
          label="Company Code"
          value={companyCode}
          onChangeText={setCompanyCode}
          icon={Building2}
        />

        <CustomInput
          label="Company Name"
          value={companyName}
          onChangeText={setCompanyName}
          icon={Building2}
        />

        <CustomInput
          label="Full Registered Address"
          value={address1}
          onChangeText={setAddress1}
          icon={MapPin}
        />

        <CustomInput
          label="Support Phone Number"
          value={phoneNo}
          onChangeText={setPhoneNo}
          icon={Phone}
          keyboardType="phone-pad"
        />

        <CustomInput
          label="Company Official Email"
          value={email}
          onChangeText={setEmail}
          icon={Mail}
          keyboardType="email-address"
        />
      </View>

      {/* Section 2: Shift, Timing & Salary Policy */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>2. Shift Timings & Salary Rules</Text>

        <CustomInput
          label="Office Start Time"
          value={officeStartTime}
          onChangeText={setOfficeStartTime}
          icon={Clock}
        />

        <CustomInput
          label="Office End Time"
          value={officeEndTime}
          onChangeText={setOfficeEndTime}
          icon={Clock}
        />

        <CustomInput
          label="Grace Period Minutes"
          value={graceMinutes}
          onChangeText={setGraceMinutes}
          icon={Clock}
          keyboardType="numeric"
        />

        <CustomInput
          label="Full Day Standard Hours"
          value={fullDayHours}
          onChangeText={setFullDayHours}
          icon={Clock}
          keyboardType="numeric"
        />

        <CustomInput
          label="Salary Cycle Cutoff Day"
          value={salaryCycleDay}
          onChangeText={setSalaryCycleDay}
          icon={Clock}
          keyboardType="numeric"
        />

        <CustomInput
          label="Weekly Off Day"
          value={weekOffDay}
          onChangeText={setWeekOffDay}
          icon={Clock}
        />
      </View>

      {/* Section 3: Geo-Fence & Security Verification */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>3. Geo-Fence GPS & Photo Verification</Text>

        <View style={styles.switchRow}>
          <View style={styles.switchTextGroup}>
            <Text style={styles.switchLabel}>Geo-Fence Check Required</Text>
            <Text style={styles.switchSub}>Enforce 100m GPS radius for mobile attendance</Text>
          </View>
          <Switch
            value={geoFenceRequired}
            onValueChange={handleGeoFenceToggle}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextGroup}>
            <Text style={styles.switchLabel}>Photo Selfie Required</Text>
            <Text style={styles.switchSub}>Require camera selfie capture during clock-in</Text>
          </View>
          <Switch
            value={photoRequired}
            onValueChange={setPhotoRequired}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextGroup}>
            <Text style={styles.switchLabel}>Company Status Active</Text>
            <Text style={styles.switchSub}>Enable organizational operations</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: COLORS.border, true: COLORS.success }}
          />
        </View>

        {geoFenceRequired ? (
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity 
              style={styles.gpsFetchBtn} 
              onPress={() => fetchCurrentGeoLocation(true)}
              disabled={locating}
            >
              <Navigation size={16} color="#ffffff" />
              <Text style={styles.gpsFetchText}>
                {locating ? 'Fetching Current Location...' : '📍 Auto-Fetch Current GPS Location'}
              </Text>
            </TouchableOpacity>

            <CustomInput
              label="Location Name"
              value={location}
              onChangeText={setLocation}
              icon={Map}
              placeholder="e.g. HQ Tech Park Tower 1"
            />

            <CustomInput
              label="HQ Latitude"
              value={latitude}
              onChangeText={setLatitude}
              icon={MapPin}
              keyboardType="numeric"
              placeholder="19.076000"
            />

            <CustomInput
              label="HQ Longitude"
              value={longitude}
              onChangeText={setLongitude}
              icon={MapPin}
              keyboardType="numeric"
              placeholder="72.877700"
            />

            <CustomInput
              label="Geo-Fence Radius"
              value={geoFenceRadius}
              onChangeText={setGeoFenceRadius}
              icon={MapPin}
              keyboardType="numeric"
              placeholder="100"
            />
          </View>
        ) : (
          <View style={styles.disabledLocCard}>
            <Text style={styles.disabledLocText}>
              🚫 Geo-Fence is Disabled. Location Name, Latitude, Longitude, and Radius will not be saved.
            </Text>
          </View>
        )}
      </View>

      {/* Save Action */}
      <PrimaryButton
        title={`Save Company Settings ('${companyId}')`}
        onPress={handleSave}
        loading={loading}
        icon={Save}
        style={{ marginBottom: 24 }}
      />
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  screenSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  newBranchBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newBranchText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 6,
  },
  switchTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  switchSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  gpsFetchBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 6,
  },
  gpsFetchText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledLocCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledLocText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
