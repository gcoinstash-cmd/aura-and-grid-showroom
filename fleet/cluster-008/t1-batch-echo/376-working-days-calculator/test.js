import assert from 'node:assert/strict';
import { countWorkingDays, addWorkingDays } from './engine.js';

console.log('⚡ [Unit #376 Test Suite] Testing Working Days Calculator...');

// Test 1: Count working days in Mon-Sun week
{
  // Monday 2026-10-05 to Friday 2026-10-09 = 5 business days
  const workdays = countWorkingDays('2026-10-05', '2026-10-09');
  assert.equal(workdays, 5);

  // With a holiday on Wednesday 2026-10-07
  const withHoliday = countWorkingDays('2026-10-05', '2026-10-09', ['2026-10-07']);
  assert.equal(withHoliday, 4);
  console.log('  ✔ Workday counting with holidays passed');
}

// Test 2: Add working days across weekend
{
  // Friday 2026-10-09 + 1 working day = Monday 2026-10-12
  const nextWorkDay = addWorkingDays('2026-10-09', 1);
  assert.equal(nextWorkDay.toISOString().slice(0, 10), '2026-10-12');
  console.log('  ✔ Weekend skipping workday addition passed');
}
