/**
 * Unit #384: Binary Bitmask Flags Calculator & Permission Rig
 * Track 1 (Lean Tuner) — High-Speed Bitwise Flag Engine
 */

export class BitmaskFlags {
  constructor(flagMap = {}) {
    this.flagMap = { ...flagMap };
    this.reverseMap = {};
    for (const [name, bit] of Object.entries(this.flagMap)) {
      this.reverseMap[bit] = name;
    }
  }

  has(mask, flagName) {
    const bit = this.flagMap[flagName];
    if (bit === undefined) return false;
    return (mask & bit) === bit;
  }

  add(mask, flagName) {
    const bit = this.flagMap[flagName];
    if (bit === undefined) throw new Error(`Unknown flag '${flagName}'`);
    return mask | bit;
  }

  remove(mask, flagName) {
    const bit = this.flagMap[flagName];
    if (bit === undefined) throw new Error(`Unknown flag '${flagName}'`);
    return mask & ~bit;
  }

  toggle(mask, flagName) {
    const bit = this.flagMap[flagName];
    if (bit === undefined) throw new Error(`Unknown flag '${flagName}'`);
    return mask ^ bit;
  }

  toList(mask) {
    const active = [];
    for (const [name, bit] of Object.entries(this.flagMap)) {
      if ((mask & bit) === bit) {
        active.push(name);
      }
    }
    return active;
  }

  fromList(names) {
    let mask = 0;
    for (const name of names) {
      mask = this.add(mask, name);
    }
    return mask;
  }
}
