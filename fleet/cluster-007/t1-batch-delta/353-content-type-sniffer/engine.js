/**
 * Unit #353: Content-Type MIME Sniffer & Header Parser
 * Track 1 (Lean Tuner) — RFC 7231 Header Parser & Magic Byte Sniffer
 */

export function parseContentType(headerStr) {
  if (typeof headerStr !== 'string') return { type: 'application/octet-stream', parameters: {} };

  const parts = headerStr.split(';').map(p => p.trim());
  const type = parts[0].toLowerCase();
  const parameters = {};

  for (let i = 1; i < parts.length; i++) {
    const eqIdx = parts[i].indexOf('=');
    if (eqIdx !== -1) {
      const key = parts[i].slice(0, eqIdx).trim().toLowerCase();
      let val = parts[i].slice(eqIdx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      parameters[key] = val;
    }
  }

  return { type, parameters };
}

export function sniffMimeType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return 'application/octet-stream';

  // PNG
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  // JPEG
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // GIF
  if (buffer.length >= 6 && buffer.slice(0, 3).toString('ascii') === 'GIF') {
    return 'image/gif';
  }
  // PDF
  if (buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === '%PDF') {
    return 'application/pdf';
  }

  return 'application/octet-stream';
}
