/**
 * Unit #363: Micro-Priority Task Heap Queue
 * Track 1 (Lean Tuner) — Binary Min-Heap Priority Task Rig
 */

export class PriorityQueue {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.comparator = comparator;
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0] || null;
  }

  push(item) {
    this.heap.push(item);
    this._siftUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._siftDown(0);
    }
    return top;
  }

  _siftUp(idx) {
    while (idx > 0) {
      const parent = (idx - 1) >>> 1;
      if (this.comparator(this.heap[idx], this.heap[parent]) < 0) {
        [this.heap[idx], this.heap[parent]] = [this.heap[parent], this.heap[idx]];
        idx = parent;
      } else {
        break;
      }
    }
  }

  _siftDown(idx) {
    const len = this.heap.length;
    while ((idx << 1) + 1 < len) {
      let smallest = (idx << 1) + 1;
      const right = smallest + 1;
      if (right < len && this.comparator(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (this.comparator(this.heap[smallest], this.heap[idx]) < 0) {
        [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
        idx = smallest;
      } else {
        break;
      }
    }
  }
}
