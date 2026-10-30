import assert from 'node:assert/strict';
import { parseCidr, subnetsOverlap, subnetContains } from './engine.js';

console.log('⚡ [Unit #398 Test Suite] Testing IP Subnet Overlap Detector...');

// Test 1: Subnet overlapping
{
  assert.equal(subnetsOverlap('10.0.0.0/16', '10.0.1.0/24'), true);
  assert.equal(subnetsOverlap('10.0.0.0/24', '10.0.1.0/24'), false);
  assert.equal(subnetsOverlap('192.168.1.0/24', '192.168.0.0/16'), true);
  console.log('  ✔ CIDR overlap detection verified');
}

// Test 2: Subnet containment
{
  assert.equal(subnetContains('10.0.0.0/16', '10.0.50.1'), true);
  assert.equal(subnetContains('10.0.0.0/16', '10.1.0.1'), false);
  assert.equal(subnetContains('10.0.0.0/16', '10.0.2.0/24'), true);
  console.log('  ✔ IP and CIDR subnet containment verified');
}
