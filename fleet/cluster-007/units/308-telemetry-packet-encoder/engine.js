/**
 * Unit #308: Base64 / Hex Telemetry Packet Encoder
 * Track 1 (Lean Tuner) — Standalone Packet Serializer & Encoding Rig
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

/**
 * Custom error for packet encoding / decoding operations.
 */
export class PacketEncodingError extends Error {
  /**
   * @param {string} message 
   * @param {string} [code='ERR_PACKET_ENCODING'] 
   * @param {any} [details=null] 
   */
  constructor(message, code = 'ERR_PACKET_ENCODING', details = null) {
    super(message);
    this.name = 'PacketEncodingError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Computes a fast CRC-16-CCITT checksum for packet integrity framing.
 * @param {Buffer} buffer 
 * @returns {number} 16-bit checksum
 */
export function computeCrc16(buffer) {
  let crc = 0xFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc;
}

/**
 * Encodes data to Base64 or Base64URL.
 * @param {string|Buffer|Object} input 
 * @param {boolean} [urlSafe=false] 
 * @returns {string}
 */
export function toBase64(input, urlSafe = false) {
  let buf;
  if (Buffer.isBuffer(input)) {
    buf = input;
  } else if (typeof input === 'object' && input !== null) {
    buf = Buffer.from(JSON.stringify(input), 'utf8');
  } else {
    buf = Buffer.from(String(input), 'utf8');
  }

  let b64 = buf.toString('base64');
  if (urlSafe) {
    b64 = b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  return b64;
}

/**
 * Decodes Base64 or Base64URL to Buffer or UTF-8 string.
 * @param {string} b64Str 
 * @param {boolean} [asBuffer=false] 
 * @returns {Buffer|string}
 */
export function fromBase64(b64Str, asBuffer = false) {
  if (typeof b64Str !== 'string') {
    throw new PacketEncodingError('Input must be a valid base64 string', 'ERR_INVALID_INPUT');
  }
  let cleaned = b64Str.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (cleaned.length % 4 !== 0) {
    cleaned += '=';
  }
  const buf = Buffer.from(cleaned, 'base64');
  return asBuffer ? buf : buf.toString('utf8');
}

/**
 * Encodes input to Hex string.
 * @param {string|Buffer|Object} input 
 * @returns {string}
 */
export function toHex(input) {
  let buf;
  if (Buffer.isBuffer(input)) {
    buf = input;
  } else if (typeof input === 'object' && input !== null) {
    buf = Buffer.from(JSON.stringify(input), 'utf8');
  } else {
    buf = Buffer.from(String(input), 'utf8');
  }
  return buf.toString('hex');
}

/**
 * Decodes Hex string to Buffer or UTF-8 string.
 * @param {string} hexStr 
 * @param {boolean} [asBuffer=false] 
 * @returns {Buffer|string}
 */
export function fromHex(hexStr, asBuffer = false) {
  if (typeof hexStr !== 'string' || !/^[0-9a-fA-F]*$/.test(hexStr) || hexStr.length % 2 !== 0) {
    throw new PacketEncodingError('Input must be a valid even-length hex string', 'ERR_INVALID_HEX');
  }
  const buf = Buffer.from(hexStr, 'hex');
  return asBuffer ? buf : buf.toString('utf8');
}

/**
 * Encodes a complete telemetry payload with optional CRC framing.
 * Format: `[PREFIX:][PAYLOAD][#CRC16]`
 * 
 * @param {string|Buffer|Object} data 
 * @param {'base64'|'base64url'|'hex'} [encoding='base64'] 
 * @param {{ prefix?: string, includeCrc?: boolean }} [options={}] 
 * @returns {string} Framed encoded packet
 */
export function encodePacket(data, encoding = 'base64', options = {}) {
  let rawBuf;
  if (Buffer.isBuffer(data)) {
    rawBuf = data;
  } else if (typeof data === 'object' && data !== null) {
    rawBuf = Buffer.from(JSON.stringify(data), 'utf8');
  } else {
    rawBuf = Buffer.from(String(data), 'utf8');
  }

  let body = '';
  if (encoding === 'base64') body = toBase64(rawBuf, false);
  else if (encoding === 'base64url') body = toBase64(rawBuf, true);
  else if (encoding === 'hex') body = toHex(rawBuf);
  else throw new PacketEncodingError(`Unsupported encoding: ${encoding}`, 'ERR_UNSUPPORTED_ENCODING');

  let packet = body;
  if (options.prefix) {
    packet = `${options.prefix}:${packet}`;
  }
  if (options.includeCrc) {
    const crc = computeCrc16(rawBuf).toString(16).padStart(4, '0').toUpperCase();
    packet = `${packet}#${crc}`;
  }

  return packet;
}

/**
 * Decodes and validates a framed packet.
 * 
 * @param {string} packetStr 
 * @param {'base64'|'base64url'|'hex'} [encoding='base64'] 
 * @param {{ expectedPrefix?: string, verifyCrc?: boolean, parseJson?: boolean }} [options={}] 
 * @returns {{ data: any, rawBuffer: Buffer, crcValid: boolean }}
 */
export function decodePacket(packetStr, encoding = 'base64', options = {}) {
  if (typeof packetStr !== 'string' || !packetStr.trim()) {
    throw new PacketEncodingError('Packet string must not be empty', 'ERR_EMPTY_PACKET');
  }

  let current = packetStr.trim();
  let expectedCrcHex = null;

  // Extract CRC if present
  const hashIdx = current.lastIndexOf('#');
  if (hashIdx !== -1) {
    expectedCrcHex = current.slice(hashIdx + 1).trim();
    current = current.slice(0, hashIdx);
  }

  // Extract Prefix if present
  if (options.expectedPrefix) {
    const prefixToken = `${options.expectedPrefix}:`;
    if (!current.startsWith(prefixToken)) {
      throw new PacketEncodingError(`Prefix mismatch: expected '${options.expectedPrefix}'`, 'ERR_PREFIX_MISMATCH');
    }
    current = current.slice(prefixToken.length);
  } else if (current.includes(':')) {
    // Strip arbitrary prefix if no specific expected prefix
    current = current.slice(current.indexOf(':') + 1);
  }

  // Decode Body
  let rawBuf;
  if (encoding === 'base64' || encoding === 'base64url') {
    rawBuf = fromBase64(current, true);
  } else if (encoding === 'hex') {
    rawBuf = fromHex(current, true);
  } else {
    throw new PacketEncodingError(`Unsupported encoding: ${encoding}`, 'ERR_UNSUPPORTED_ENCODING');
  }

  let crcValid = true;
  if (options.verifyCrc && expectedCrcHex) {
    const computedCrc = computeCrc16(rawBuf).toString(16).padStart(4, '0').toUpperCase();
    if (computedCrc !== expectedCrcHex.toUpperCase()) {
      crcValid = false;
      throw new PacketEncodingError(`CRC mismatch: expected ${expectedCrcHex}, computed ${computedCrc}`, 'ERR_CRC_MISMATCH');
    }
  }

  let resultData = rawBuf.toString('utf8');
  if (options.parseJson) {
    try {
      resultData = JSON.parse(resultData);
    } catch (err) {
      throw new PacketEncodingError(`Failed to parse payload as JSON: ${err.message}`, 'ERR_JSON_PARSE');
    }
  }

  return {
    data: resultData,
    rawBuffer: rawBuf,
    crcValid
  };
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkPacketEncoder(iterations = 2000) {
  const sample = { sensor: 'ACCEL_Z', g_force: 3.82, timestamp: 1793388000 };
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const encoded = encodePacket(sample, 'base64url', { prefix: 'GF_TEL', includeCrc: true });
    decodePacket(encoded, 'base64url', { expectedPrefix: 'GF_TEL', verifyCrc: true, parseJson: true });
  }
  const totalMs = performance.now() - start;
  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
