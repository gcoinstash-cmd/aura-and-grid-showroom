/**
 * Unit #369: Fixed-Size & Delimiter Stream Chunker
 * Track 1 (Lean Tuner) — Pure Node.js Memory Buffer & Stream Chunker
 */

import { Transform } from 'node:stream';

export function chunkBuffer(buffer, chunkSize = 1024) {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }
  if (chunkSize <= 0) throw new RangeError('chunkSize must be > 0');
  
  const chunks = [];
  let offset = 0;
  while (offset < buffer.length) {
    const end = Math.min(offset + chunkSize, buffer.length);
    chunks.push(buffer.subarray(offset, end));
    offset = end;
  }
  return chunks;
}

export function chunkByDelimiter(buffer, delimiter = '\n') {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }
  const delimBuf = Buffer.isBuffer(delimiter) ? delimiter : Buffer.from(delimiter);
  const chunks = [];
  let start = 0;
  let idx = buffer.indexOf(delimBuf, start);

  while (idx !== -1) {
    chunks.push(buffer.subarray(start, idx));
    start = idx + delimBuf.length;
    idx = buffer.indexOf(delimBuf, start);
  }

  if (start < buffer.length) {
    chunks.push(buffer.subarray(start));
  }
  return chunks;
}

export function createFixedChunkStream(chunkSize = 1024) {
  let accumulator = Buffer.alloc(0);
  return new Transform({
    transform(chunk, encoding, callback) {
      accumulator = Buffer.concat([accumulator, chunk]);
      while (accumulator.length >= chunkSize) {
        this.push(accumulator.subarray(0, chunkSize));
        accumulator = accumulator.subarray(chunkSize);
      }
      callback();
    },
    flush(callback) {
      if (accumulator.length > 0) {
        this.push(accumulator);
      }
      callback();
    }
  });
}
