/**
 * Unit #346: IPv4 / IPv6 Subnet CIDR Mask Calculator
 * Track 1 (Lean Tuner) — Pure Bitwise Subnet Calculator
 */

export class CidrCalculationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CidrCalculationError';
  }
}

export function ipToLong(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new CidrCalculationError(`Invalid IPv4: ${ip}`);
  let res = 0;
  for (let i = 0; i < 4; i++) {
    const oct = parseInt(parts[i], 10);
    if (isNaN(oct) || oct < 0 || oct > 255) throw new CidrCalculationError(`Invalid octet ${parts[i]}`);
    res = (res << 8) | oct;
  }
  return res >>> 0;
}

export function longToIp(long) {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255
  ].join('.');
}

export function parseCidr(cidrStr) {
  const [ip, bitsStr] = cidrStr.trim().split('/');
  if (!bitsStr) throw new CidrCalculationError('Missing subnet prefix length');
  const bits = parseInt(bitsStr, 10);
  if (isNaN(bits) || bits < 0 || bits > 32) throw new CidrCalculationError('Invalid prefix: 0-32 allowed');

  const ipLong = ipToLong(ip);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  const network = (ipLong & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const totalHosts = bits >= 31 ? (bits === 31 ? 2 : 1) : Math.pow(2, 32 - bits);
  const usableHosts = bits >= 31 ? totalHosts : Math.max(0, totalHosts - 2);

  return {
    cidr: cidrStr,
    networkIp: longToIp(network),
    broadcastIp: longToIp(broadcast),
    netmask: longToIp(mask),
    firstUsableIp: bits >= 31 ? longToIp(network) : longToIp(network + 1),
    lastUsableIp: bits >= 31 ? longToIp(broadcast) : longToIp(broadcast - 1),
    totalHosts,
    usableHosts,
    prefixLength: bits
  };
}

export function containsIp(cidrStr, targetIp) {
  const info = parseCidr(cidrStr);
  const targetLong = ipToLong(targetIp);
  const netLong = ipToLong(info.networkIp);
  const maskLong = ipToLong(info.netmask);
  return (targetLong & maskLong) >>> 0 === netLong;
}
