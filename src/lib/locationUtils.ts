// Location Utilities for Clinic Attendance

// Clinic coordinates
export const CLINIC_LOCATION = {
  latitude: 14.655518794401319,
  longitude: 121.01139776530485,
};

// Tolerance radius in meters (50-100m for accuracy buffer)
export const LOCATION_TOLERANCE_METERS = 100;

/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if current location is within clinic premises
 */
export const isWithinClinicPremises = (
  currentLat: number,
  currentLon: number,
  tolerance: number = LOCATION_TOLERANCE_METERS
): boolean => {
  const distance = calculateDistance(
    currentLat,
    currentLon,
    CLINIC_LOCATION.latitude,
    CLINIC_LOCATION.longitude
  );
  return distance <= tolerance;
};

/**
 * Get device current location using Geolocation API
 */
export const getCurrentLocation = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // Handle specific error codes
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error(
                'Location permission denied. Please enable location in your browser settings.'
              )
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(
              new Error(
                'Location information is unavailable. Please ensure GPS is enabled.'
              )
            );
            break;
          case error.TIMEOUT:
            reject(
              new Error(
                'Location request timed out. Please try again with GPS enabled.'
              )
            );
            break;
          default:
            reject(new Error('An error occurred while getting location'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0, // Don't use cached location
      }
    );
  });
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${distanceInMeters.toFixed(0)}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(2)}km`;
};

/**
 * Get location status message
 */
export const getLocationStatusMessage = (
  isWithinPremises: boolean,
  distanceInMeters: number
): string => {
  if (isWithinPremises) {
    return `✓ Within clinic premises (${formatDistance(distanceInMeters)})`;
  }
  return `✗ Outside clinic premises (${formatDistance(distanceInMeters)})`;
};
