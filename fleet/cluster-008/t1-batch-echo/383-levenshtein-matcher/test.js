import assert from 'node:assert/strict';
import { levenshteinDistance, similarityRatio, findBestMatch } from './engine.js';

console.log('⚡ [Unit #383 Test Suite] Testing Levenshtein Matcher...');

// Test 1: Standard known vector ('kitten' -> 'sitting' = 3)
{
  const dist = levenshteinDistance('kitten', 'sitting');
  assert.equal(dist, 3);

  const ratio = similarityRatio('kitten', 'sitting');
  assert.ok(ratio > 0.5 && ratio < 0.6);
  console.log('  ✔ Levenshtein distance matrix calculation passed');
}

// Test 2: Find best match in candidate pool
{
  const target = 'apex_telemetry';
  const candidates = ['apex_radar', 'apex_telemetry_v2', 'drift_shield', 'cipher_strike'];
  const match = findBestMatch(target, candidates);

  assert.equal(match.bestMatch.target, 'apex_telemetry_v2');
  assert.ok(match.bestMatch.similarity > 0.8);
  console.log('  ✔ Candidate pool fuzzy matching passed');
}
