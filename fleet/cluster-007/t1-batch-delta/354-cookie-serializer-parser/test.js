import assert from 'node:assert/strict';
import { parseCookies, serializeCookie, signCookieValue, unsignCookieValue } from './engine.js';

console.log('⚡ [Unit #354 Test Suite] Testing Cookie Serializer & Signer...');

// Test 1: Parser & Serializer
{
  const raw = 'session_id=s84192; theme=dark; token=xyz';
  const parsed = parseCookies(raw);
  assert.equal(parsed.session_id, 's84192');
  assert.equal(parsed.theme, 'dark');

  const serialized = serializeCookie('sid', '123', { httpOnly: true, secure: true, sameSite: 'strict' });
  assert.ok(serialized.includes('HttpOnly'));
  assert.ok(serialized.includes('Secure'));
  assert.ok(serialized.includes('SameSite=Strict'));
  console.log('  ✔ RFC 6265 serialization & parsing verified');
}

// Test 2: HMAC signing
{
  const secret = 'super-secret-cluster-key';
  const signed = signCookieValue('user_admin', secret);
  assert.equal(unsignCookieValue(signed, secret), 'user_admin');
  assert.equal(unsignCookieValue(signed + 'tamper', secret), null);
  console.log('  ✔ HMAC-SHA256 cookie signing & tamper rejection passed');
}
