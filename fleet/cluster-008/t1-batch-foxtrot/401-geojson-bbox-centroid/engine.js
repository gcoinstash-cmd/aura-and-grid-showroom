/**
 * Unit #401: GeoJSON Bounding Box & Centroid Rig
 * Track 1 (Lean Tuner) — GIS Spatial Bounding Box & Centroid Math
 */

function extractCoordinates(geojson) {
  if (Array.isArray(geojson)) {
    // If array of [lon, lat]
    if (typeof geojson[0] === 'number') return [geojson];
    // If nested array
    const flat = [];
    const flatten = arr => {
      if (typeof arr[0] === 'number') {
        flat.push(arr);
      } else {
        arr.forEach(flatten);
      }
    };
    flatten(geojson);
    return flat;
  }

  if (geojson && geojson.type === 'FeatureCollection') {
    return geojson.features.flatMap(f => extractCoordinates(f.geometry));
  }
  if (geojson && geojson.type === 'Feature') {
    return extractCoordinates(geojson.geometry);
  }
  if (geojson && geojson.coordinates) {
    return extractCoordinates(geojson.coordinates);
  }

  return [];
}

export function calculateBbox(geojson) {
  const coords = extractCoordinates(geojson);
  if (coords.length === 0) return [0, 0, 0, 0];

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLon, minLat, maxLon, maxLat];
}

export function calculateCentroid(geojson) {
  const coords = extractCoordinates(geojson);
  if (coords.length === 0) return { lon: 0, lat: 0 };

  let sumLon = 0;
  let sumLat = 0;

  for (const [lon, lat] of coords) {
    sumLon += lon;
    sumLat += lat;
  }

  return {
    lon: Number((sumLon / coords.length).toFixed(6)),
    lat: Number((sumLat / coords.length).toFixed(6))
  };
}

export function bboxToPolygon(bbox) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  return [
    [
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat]
    ]
  ];
}
