/**
 * Unit #392: Fixed-Capacity Circular Ring Buffer Queue
 * Track 1 (Lean Tuner) — Zero-Allocation Cyclic Telemetry Buffer
 */

export class CircularRingBuffer {
  constructor(capacity = 100) {
    if (capacity <= 0) throw new RangeError('Capacity must be > 0');
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.head = 0; // write pointer
    this.tail = 0; // read pointer
    this.count = 0;
  }

  push(item) {
    let dropped = null;
    if (this.count === this.capacity) {
      dropped = this.buffer[this.tail];
      this.tail = (this.tail + 1) % this.capacity;
      this.count--;
    }

    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    this.count++;

    return dropped;
  }

  shift() {
    if (this.count === 0) return null;
    const item = this.buffer[this.tail];
    this.buffer[this.tail] = undefined;
    this.tail = (this.tail + 1) % this.capacity;
    this.count--;
    return item;
  }

  peek() {
    if (this.count === 0) return null;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[idx];
  }

  peekOldest() {
    if (this.count === 0) return null;
    return this.buffer[this.tail];
  }

  toArray() {
    const res = [];
    let curr = this.tail;
    for (let i = 0; i < this.count; i++) {
      res.push(this.buffer[curr]);
      curr = (curr + 1) % this.capacity;
    }
    return res;
  }

  size() {
    return this.count;
  }

  isFull() {
    return this.count === this.capacity;
  }

  isEmpty() {
    return this.count === 0;
  }
}
