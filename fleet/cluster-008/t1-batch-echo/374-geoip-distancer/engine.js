/**
 * Unit #374: Haversine GeoIP Great-Circle Distancer & Proximity Rig
 * Track 1 (Lean Tuner) — Great-Circle Distance Engine
 */

const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_MILES = 3958.8;

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export function calculateDistance(coordA, coordB, unit = 'km') {
  const lat1 = Array.isArray(coordA) ? coordA[0] : coordA.lat;
  const lon1 = Array.isArray(coordA) ? coordA[1] : (coordA.lon ?? coordA.lng);
  const lat2 = Array.isArray(coordB) ? coordB[0] : coordB.lat;
  const lon2 = Array.isArray(coordB) ? coordB[1] : (coordB.lon ?? coordB.lng);

  if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || Number.isNaN(v))) {
    throw new TypeError('Coordinates must contain valid numerical lat and lon values');
  }

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const radius = unit === 'miles' ? EARTH_RADIUS_MILES : EARTH_RADIUS_KM;

  return Number((radius * c).toFixed(2));
}

export function isWithinRadius(coordA, coordB, radius, unit = 'km') {
  const dist = calculateDistance(coordA, coordB, unit);
  return dist <= radius;
}
