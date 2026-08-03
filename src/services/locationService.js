import * as Location from 'expo-location';

export const locationService = {
  // Cross-platform GPS Location Fetcher (iOS, Android, Web & Simulators)
  getCurrentLocation: async () => {
    // 1. Native Expo Location (iOS & Android)
    try {
      if (Location && Location.requestForegroundPermissionsAsync) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          if (loc && loc.coords) {
            return {
              latitude: Number(loc.coords.latitude.toFixed(6)),
              longitude: Number(loc.coords.longitude.toFixed(6)),
              source: 'Mobile_Hardware_GPS'
            };
          }
        }
      }
    } catch (e) {
      console.warn("Native location permission/fetch error:", e.message);
    }

    // 2. Web Geolocation API (Browsers)
    try {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: Number(pos.coords.latitude.toFixed(6)),
                longitude: Number(pos.coords.longitude.toFixed(6)),
                source: 'Browser_GPS'
              });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        });
      }
    } catch (e) {}

    // 3. IP Geolocation API Fallback
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        return {
          latitude: Number(Number(data.latitude).toFixed(6)),
          longitude: Number(Number(data.longitude).toFixed(6)),
          city: data.city || '',
          region: data.region || '',
          country: data.country_name || '',
          source: 'IP_Lookup'
        };
      }
    } catch (e) {}

    // 4. Default Office Coordinates Fallback
    return {
      latitude: 37.7751,
      longitude: -122.4192,
      source: 'Default_Office_HQ'
    };
  },

  // Reverse Geocoding latitude/longitude to human readable street address
  reverseGeocode: async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'HRMSApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const parts = [
          addr.building || addr.amenity || addr.office,
          addr.road || addr.street,
          addr.suburb || addr.neighbourhood,
          addr.city || addr.town || addr.village,
          addr.state
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
      if (data && data.display_name) return data.display_name;
    } catch (err) {}
    return `Lat: ${lat}, Lon: ${lng}`;
  }
};
