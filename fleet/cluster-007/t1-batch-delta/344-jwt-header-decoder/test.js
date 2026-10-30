import assert from 'node:assert/strict';
import { decodeJwt, validateAlgNoneSecurity, JwtSecurityError } from './engine.js';

console.log('⚡ [Unit #344 Test Suite] Testing JWT Header Decoder & Alg-None Validator...');

// Test 1: Valid HS256 Token
{
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MDAwMDAwMDB9.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const decoded = decodeJwt(validToken);
  assert.equal(decoded.header.alg, 'HS256');
  assert.equal(decoded.payload.name, 'John Doe');
  assert.equal(decoded.isExpired, false);
  assert.equal(decoded.hasSignature, true);
  console.log('  ✔ Valid HS256 token decoded cleanly');
}

// Test 2: Alg: none Detection & Rejection
{
  const noneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyMTIzIn0.';
  assert.throws(() => decodeJwt(noneToken), (err) => {
    assert.ok(err instanceof JwtSecurityError);
    assert.equal(err.code, 'ERR_ALG_NONE_FORBIDDEN');
    return true;
  });
  console.log('  ✔ Alg: none attack vector intercepted and blocked');
}

// Test 3: Expired Token Check
{
  const expiredToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJleHAiLCJleHAiOjEwMDAwMDAwMDB9.fake_sig';
  const res = decodeJwt(expiredToken);
  assert.equal(res.isExpired, true);
  console.log('  ✔ Expiration verification passed');
}
