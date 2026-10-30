/**
 * Unit #496: Sub-Millisecond UDP/TCP Heartbeat Pinger & Telemetry Probe
 * Track 1 (Lean Tuner) — Heartbeat Beacon & Network Probe Rig
 */

export class HeartbeatBeacon {
  static MAGIC = 0x47464243; // 'GFBC' (Ghost Factory Beacon)

  /**
   * Pack a heartbeat telemetry frame
   * Format (32 bytes):
   * [0..3]: Magic (4B)
   * [4..7]: Sequence Number (4B uint32)
   * [8..15]: Timestamp in ms (8B BigInt)
   * [16..23]: Node ID Hash (8B BigInt)
   * [24..27]: Status Flags (4B uint32)
   * [28..31]: CRC32 / Checksum (4B uint32)
   * @param {number} seq 
   * @param {bigint|number} nodeIdHash 
   * @param {number} statusFlags 
   * @returns {Buffer}
   */
  static pack(seq, nodeIdHash = 0x01n, statusFlags = 0x01) {
    const buf = Buffer.alloc(32);
    buf.writeUInt32BE(HeartbeatBeacon.MAGIC, 0);
    buf.writeUInt32BE(seq >>> 0, 4);
    buf.writeBigUInt64BE(BigInt(Date.now()), 8);
    buf.writeBigUInt64BE(BigInt(nodeIdHash), 16);
    buf.writeUInt32BE(statusFlags >>> 0, 24);

    // Compute checksum over first 28 bytes
    let checksum = 0x811c9dc5;
    for (let i = 0; i < 28; i++) {
      checksum ^= buf[i];
      checksum = Math.imul(checksum, 0x01000193);
    }
    buf.writeUInt32BE(checksum >>> 0, 28);
    return buf;
  }

  /**
   * Unpack and validate a heartbeat frame
   * @param {Buffer|Uint8Array} buf 
   * @returns {{ valid: boolean, seq: number, timestamp: number, nodeIdHash: string, statusFlags: number, rttMs?: number }}
   */
  static unpack(buf) {
    if (!buf || buf.length < 32) {
      return { valid: false, error: 'BUFFER_TOO_SHORT' };
    }

    const magic = buf.readUInt32BE(0);
    if (magic !== HeartbeatBeacon.MAGIC) {
      return { valid: false, error: 'INVALID_MAGIC' };
    }

    let checksum = 0x811c9dc5;
    for (let i = 0; i < 28; i++) {
      checksum ^= buf[i];
      checksum = Math.imul(checksum, 0x01000193);
    }
    const expectedChecksum = buf.readUInt32BE(28);
    if ((checksum >>> 0) !== expectedChecksum) {
      return { valid: false, error: 'CHECKSUM_MISMATCH' };
    }

    const seq = buf.readUInt32BE(4);
    const sentTs = Number(buf.readBigUInt64BE(8));
    const nodeIdHash = buf.readBigUInt64BE(16).toString(16);
    const statusFlags = buf.readUInt32BE(24);
    const rttMs = Math.max(0, Date.now() - sentTs);

    return {
      valid: true,
      seq,
      timestamp: sentTs,
      nodeIdHash,
      statusFlags,
      rttMs
    };
  }

  /**
   * Compute jitter metrics across sample latency window
   * RFC 3550 Interarrival Jitter formula: J(i) = J(i-1) + (|D(i-1, i)| - J(i-1)) / 16
   * @param {number[]} latencies Array of RTT measurements in ms
   * @returns {{ min: number, max: number, avg: number, jitter: number }}
   */
  static computeJitter(latencies) {
    if (!latencies || latencies.length === 0) {
      return { min: 0, max: 0, avg: 0, jitter: 0 };
    }

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let jitter = 0;

    for (let i = 0; i < latencies.length; i++) {
      const lat = latencies[i];
      if (lat < min) min = lat;
      if (lat > max) max = lat;
      sum += lat;

      if (i > 0) {
        const diff = Math.abs(lat - latencies[i - 1]);
        jitter += (diff - jitter) / 16;
      }
    }

    return {
      min: Number(min.toFixed(3)),
      max: Number(max.toFixed(3)),
      avg: Number((sum / latencies.length).toFixed(3)),
      jitter: Number(jitter.toFixed(3))
    };
  }
}
