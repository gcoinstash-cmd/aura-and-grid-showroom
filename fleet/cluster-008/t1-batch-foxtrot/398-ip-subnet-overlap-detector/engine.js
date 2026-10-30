/**
 * Unit #398: IPv4 CIDR Subnet Overlap & Inclusion Detector
 * Track 1 (Lean Tuner) — Bitwise IPv4 Network Range Evaluator
 */

export function ipToInt(ip) {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some(o => Number.isNaN(o) || o < 0 || o > 255)) {
    throw new Error(`Invalid IPv4 address '${ip}'`);
  }
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

export function intToIp(int) {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

export function parseCidr(cidr) {
  const [ipStr, maskStr = '32'] = cidr.split('/');
  const prefix = parseInt(maskStr, 10);
  if (Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`Invalid CIDR prefix '${maskStr}'`);
  }

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const ip = ipToInt(ipStr);
  const network = (ip & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;

  return {
    cidr,
    prefix,
    networkInt: network,
    broadcastInt: broadcast,
    startIp: intToIp(network),
    endIp: intToIp(broadcast),
    totalIps: Math.pow(2, 32 - prefix)
  };
}

export function subnetsOverlap(cidrA, cidrB) {
  const subA = parseCidr(cidrA);
  const subB = parseCidr(cidrB);

  return subA.networkInt <= subB.broadcastInt && subB.networkInt <= subA.broadcastInt;
}

export function subnetContains(parentCidr, target) {
  const parent = parseCidr(parentCidr);
  const targetInt = target.includes('/') ? parseCidr(target).networkInt : ipToInt(target);

  if (target.includes('/')) {
    const child = parseCidr(target);
    return parent.networkInt <= child.networkInt && parent.broadcastInt >= child.broadcastInt;
  }

  return targetInt >= parent.networkInt && targetInt <= parent.broadcastInt;
}
