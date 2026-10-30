import assert from 'node:assert/strict';
import { parseLinesSync, StreamLineSplitter } from './engine.js';

console.log('⚡ [Unit #371 Test Suite] Testing Line-by-Line Parser...');

// Test 1: Sync parser with mixed newlines
{
  const input = 'line1\r\nline2\nline3\n';
  const lines = parseLinesSync(input);
  assert.deepEqual(lines, ['line1', 'line2', 'line3']);
  console.log('  ✔ Mixed CRLF line parsing verified');
}

// Test 2: Chunk accumulator across streaming boundaries
{
  const splitter = new StreamLineSplitter();
  const chunk1 = 'hello telemetry\nchunk split in';
  const chunk2 = ' middle\nfinal row';

  const out1 = splitter.feed(chunk1);
  assert.deepEqual(out1, ['hello telemetry']);

  const out2 = splitter.feed(chunk2);
  assert.deepEqual(out2, ['chunk split in middle']);

  const out3 = splitter.flush();
  assert.deepEqual(out3, ['final row']);
  console.log('  ✔ Stream chunk boundary reconstitution verified');
}
