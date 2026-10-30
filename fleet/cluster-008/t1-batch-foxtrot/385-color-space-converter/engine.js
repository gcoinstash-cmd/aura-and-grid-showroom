/**
 * Unit #385: Color Space Converter (HEX, RGB, HSL, LAB)
 * Track 1 (Lean Tuner) — Multi-Space Color Deconstruction & Math Rig
 */

export function hexToRgb(hex) {
  let cleaned = hex.replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  if (cleaned.length !== 6) {
    throw new Error(`Invalid HEX color '${hex}'`);
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = v => clamp(v).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Number((s * 100).toFixed(1)),
    l: Number((l * 100).toFixed(1))
  };
}

export function rgbToLab(r, g, b) {
  // Convert RGB to XYZ (D65 standard)
  let varR = r / 255;
  let varG = g / 255;
  let varB = b / 255;

  varR = varR > 0.04045 ? Math.pow((varR + 0.055) / 1.055, 2.4) : varR / 12.92;
  varG = varG > 0.04045 ? Math.pow((varG + 0.055) / 1.055, 2.4) : varG / 12.92;
  varB = varB > 0.04045 ? Math.pow((varB + 0.055) / 1.055, 2.4) : varB / 12.92;

  varR *= 100;
  varG *= 100;
  varB *= 100;

  const x = varR * 0.4124 + varG * 0.3576 + varB * 0.1805;
  const y = varR * 0.2126 + varG * 0.7152 + varB * 0.0722;
  const z = varR * 0.0193 + varG * 0.1192 + varB * 0.9505;

  // D65 reference white
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let varX = x / refX;
  let varY = y / refY;
  let varZ = z / refZ;

  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  varX = f(varX);
  varY = f(varY);
  varZ = f(varZ);

  return {
    L: Number((116 * varY - 16).toFixed(2)),
    a: Number((500 * (varX - varY)).toFixed(2)),
    b: Number((200 * (varY - varZ)).toFixed(2))
  };
}
