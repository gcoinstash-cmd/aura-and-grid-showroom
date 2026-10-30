/**
 * Unit #381: Cryptographically Uniform Fisher-Yates Array Shuffler
 * Track 1 (Lean Tuner) — CSPRNG Durstenfeld Shuffler & Sampler
 */

import crypto from 'node:crypto';

export function shuffle(array, options = {}) {
  if (!Array.isArray(array)) {
    throw new TypeError('Input must be an array');
  }

  const { inPlace = false, secure = true } = options;
  const target = inPlace ? array : [...array];
  const len = target.length;

  for (let i = len - 1; i > 0; i--) {
    let j;
    if (secure) {
      j = crypto.randomInt(0, i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    const temp = target[i];
    target[i] = target[j];
    target[j] = temp;
  }

  return target;
}

export function sample(array, count = 1) {
  if (!Array.isArray(array)) throw new TypeError('Input must be an array');
  if (count <= 0) return [];
  if (count >= array.length) return shuffle(array);

  const shuffled = shuffle(array, { inPlace: false, secure: true });
  return shuffled.slice(0, count);
}
