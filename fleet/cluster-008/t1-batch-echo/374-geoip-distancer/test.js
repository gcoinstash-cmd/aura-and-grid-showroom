import assert from 'node:assert/strict';
import { calculateDistance, isWithinRadius } from './engine.js';

console.log('⚡ [Unit #374 Test Suite] Testing GeoIP Distancer...');

// Test 1: London to Paris distance (~343 km)
{
  const london = { lat: 51.5074, lon: -0.1278 };
  const paris = { lat: 48.8566, lon: 2.3522 };

  const distKm = calculateDistance(london, paris, 'km');
  assert.ok(distKm >= 340 && distKm <= 350, `Expected ~343km, got ${distKm}`);

  const distMiles = calculateDistance(london, paris, 'miles');
  assert.ok(distMiles >= 210 && distMiles <= 220, `Expected ~213 miles, got ${distMiles}`);

  assert.equal(isWithinRadius(london, paris, 400, 'km'), true);
  assert.equal(isWithinRadius(london, paris, 300, 'km'), false);
  console.log('  ✔ Haversine great-circle distance & proximity checks passed');
}
