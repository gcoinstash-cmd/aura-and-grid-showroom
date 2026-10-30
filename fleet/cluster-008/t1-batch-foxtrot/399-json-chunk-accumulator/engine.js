/**
 * Unit #399: Streaming JSON Chunk Buffer & Balanced Object Framer
 * Track 1 (Lean Tuner) — Brace-Balancing Stream Chunk Reassembler
 */

export class JsonChunkAccumulator {
  constructor() {
    this.buffer = '';
  }

  feed(chunk) {
    this.buffer += String(chunk);
    const parsedObjects = [];
    let startIdx = -1;
    let depth = 0;
    let inString = false;
    let isEscaped = false;

    for (let i = 0; i < this.buffer.length; i++) {
      const char = this.buffer[i];

      if (inString) {
        if (isEscaped) {
          isEscaped = false;
        } else if (char === '\\') {
          isEscaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{' || char === '[') {
        if (depth === 0) startIdx = i;
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0 && startIdx !== -1) {
          const jsonSubstring = this.buffer.slice(startIdx, i + 1);
          try {
            parsedObjects.push(JSON.parse(jsonSubstring));
            this.buffer = this.buffer.slice(i + 1);
            i = -1; // reset pointer to search next object in remaining buffer
            startIdx = -1;
          } catch {
            // keep accumulating if malformed
          }
        }
      }
    }

    return parsedObjects;
  }

  clear() {
    this.buffer = '';
  }
}
