import assert from 'node:assert/strict';
import { calculateBbox, calculateCentroid, bboxToPolygon } from './engine.js';

console.log('⚡ [Unit #401 Test Suite] Testing GeoJSON Bbox & Centroid Rig...');

// Test 1: Bbox calculation
{
  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [[-118.4, 33.9], [-118.2, 33.9], [-118.2, 34.1], [-118.4, 34.1], [-118.4, 33.9]]
      ]
    }
  };

  const bbox = calculateBbox(feature);
  assert.deepEqual(bbox, [-118.4, 33.9, -118.2, 34.1]);

  const centroid = calculateCentroid(feature);
  assert.ok(Math.abs(centroid.lon - (-118.3)) < 0.05);
  assert.ok(Math.abs(centroid.lat - 34.0) < 0.05);

  const poly = bboxToPolygon(bbox);
  assert.equal(poly[0].length, 5);
  console.log('  ✔ Bbox, centroid, and bounding polygon verified');
}
