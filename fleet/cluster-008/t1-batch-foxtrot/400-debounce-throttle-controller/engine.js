/**
 * Unit #400: High-Precision Debounce & Throttle Rate Controller
 * Track 1 (Lean Tuner) — Zero-Dependency Rate Limiting Wrappers
 */

export function debounce(fn, waitMs = 100) {
  let timeoutId = null;

  const debounced = function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(this, args);
    }, waitMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

export function throttle(fn, waitMs = 100) {
  let lastTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  const throttled = function (...args) {
    const now = Date.now();
    const remaining = waitMs - (now - lastTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > waitMs) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn.apply(lastThis, lastArgs);
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastTime = 0;
  };

  return throttled;
}
