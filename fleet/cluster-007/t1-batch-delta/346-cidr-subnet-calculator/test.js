import assert from 'node:assert/strict';
import { parseCidr, containsIp, ipToLong, longToIp } from './engine.js';

console.log('⚡ [Unit #346 Test Suite] Testing CIDR Subnet Calculator...');

// Test 1: Standard /24 subnet
{
  const res = parseCidr('192.168.1.50/24');
  assert.equal(res.networkIp, '192.168.1.0');
  assert.equal(res.broadcastIp, '192.168.1.255');
  assert.equal(res.netmask, '255.255.255.0');
  assert.equal(res.firstUsableIp, '192.168.1.1');
  assert.equal(res.lastUsableIp, '192.168.1.254');
  assert.equal(res.usableHosts, 254);
  console.log('  ✔ Standard /24 subnet calculated correctly');
}

// Test 2: Ingress range verification
{
  assert.equal(containsIp('10.0.0.0/8', '10.254.12.1'), true);
  assert.equal(containsIp('10.0.0.0/8', '192.168.1.1'), false);
  assert.equal(containsIp('172.16.0.0/12', '172.31.255.254'), true);
  assert.equal(containsIp('172.16.0.0/12', '172.32.0.1'), false);
  console.log('  ✔ CIDR boundary checks verified');
}
