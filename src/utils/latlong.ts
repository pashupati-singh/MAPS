import axios from "axios";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

/**
 * Get latitude and longitude from address using Google Geocoding API
 * @param address string
 * @returns { latitude: number, longitude: number }
 */
export async function getLatLongFromAddress(address: string) {
  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== "OK") {
      throw new Error("Unable to fetch coordinates for the given address");
    }

    const location = response.data.results[0].geometry.location;
    return { latitude: location.lat, longitude: location.lng };
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch coordinates");
  }
}


/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 latitude of first point
 * @param lon1 longitude of first point
 * @param lat2 latitude of second point
 * @param lon2 longitude of second point
 * @returns distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // radius of Earth in meters
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}
