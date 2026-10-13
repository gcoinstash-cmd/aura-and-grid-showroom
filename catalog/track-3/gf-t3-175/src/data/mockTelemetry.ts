import { CellData, LedgerBlock, TestCaseResult } from '../types/telemetry';

export const INITIAL_60_CELLS: CellData[] = Array.from({ length: 60 }, (_, i) => {
  const baseV = 3.700;
  // Natural cell deviation within ±0.012 V
  const delta = Math.sin(i * 1.3) * 0.008 + (Math.cos(i * 0.7) * 0.004);
  const tempDelta = Math.sin(i * 0.4) * 2.1;
  return {
    id: i + 1,
    voltage: Number((baseV + delta).toFixed(3)),
    temperature: Number((28.5 + tempDelta).toFixed(1)),
    internalResistance: Number((1.42 + Math.abs(delta) * 5).toFixed(2)),
    balancing: i % 7 === 0,
    status: 'nominal',
  };
});

export const INITIAL_LEDGER_BLOCKS: LedgerBlock[] = [
  {
    blockHeight: 1048572,
    sequenceId: 1000188,
    timestamp: '2026-10-11T23:36:58.200Z',
    prevHash: '0x8f4b1a7c3e9d201948ba9321ef7809a4731802fb6dc31952e4092b7ca91834df',
    currHash: '0x3a9f24e7c10b889d412e8731adbc0935518bfe3904a298132e48fa2981ccba01',
    payloadDigest: 'sha256:6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    metrics: {
      soc: 78.4,
      soh: 99.2,
      packVoltage: 222.1,
      regenKwh: 14.82,
      anomalousCells: 0,
    },
    verified: true,
  },
  {
    blockHeight: 1048573,
    sequenceId: 1000189,
    timestamp: '2026-10-11T23:37:00.200Z',
    prevHash: '0x3a9f24e7c10b889d412e8731adbc0935518bfe3904a298132e48fa2981ccba01',
    currHash: '0x992b10ec871a33dfbca0894231bfa82904128fdb7718921ccae109b837418902',
    payloadDigest: 'sha256:d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
    metrics: {
      soc: 78.5,
      soh: 99.2,
      packVoltage: 222.3,
      regenKwh: 14.89,
      anomalousCells: 0,
    },
    verified: true,
  },
  {
    blockHeight: 1048574,
    sequenceId: 1000190,
    timestamp: '2026-10-11T23:37:02.200Z',
    prevHash: '0x992b10ec871a33dfbca0894231bfa82904128fdb7718921ccae109b837418902',
    currHash: '0x4f19bca88319e712a490bc1e9821ef9a12803bba9812cc11449832710bbef420',
    payloadDigest: 'sha256:4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    metrics: {
      soc: 78.7,
      soh: 99.2,
      packVoltage: 222.6,
      regenKwh: 14.97,
      anomalousCells: 0,
    },
    verified: true,
  },
  {
    blockHeight: 1048575,
    sequenceId: 1000191,
    timestamp: '2026-10-11T23:37:04.200Z',
    prevHash: '0x4f19bca88319e712a490bc1e9821ef9a12803bba9812cc11449832710bbef420',
    currHash: '0x17c0a82b99ef73145021a8d9b13907cbf41982ea09c0012e8b23398ca12801ef',
    payloadDigest: 'sha256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    metrics: {
      soc: 78.9,
      soh: 99.2,
      packVoltage: 222.9,
      regenKwh: 15.06,
      anomalousCells: 0,
    },
    verified: true,
  },
];

export const INITIAL_TEST_SUITE: TestCaseResult[] = [
  {
    id: 'TEST-01',
    name: 'test_coulomb_counting_500hz_precision',
    category: 'SOC_ALGO',
    status: 'passed',
    executionTimeMs: 4.2,
    assertion: 'Coulomb integration error <= 0.002% over 500,000 continuous ticks',
  },
  {
    id: 'TEST-02',
    name: 'test_ocv_interpolation_cold_soak_minus10c',
    category: 'SOC_ALGO',
    status: 'passed',
    executionTimeMs: 6.8,
    assertion: 'Extended Kalman filter converges within 1.8 seconds at -10°C pack temp',
  },
  {
    id: 'TEST-03',
    name: 'test_regen_brake_blend_92_percent_recapture',
    category: 'REGEN_BLEND',
    status: 'passed',
    executionTimeMs: 5.1,
    assertion: 'Kinetic energy recovery reaches 92.4% during 60 km/h -> 0 km/h stop event',
  },
  {
    id: 'TEST-04',
    name: 'test_friction_hydraulic_handoff_threshold',
    category: 'REGEN_BLEND',
    status: 'passed',
    executionTimeMs: 3.9,
    assertion: 'Smooth hydraulic brake handoff below 8 km/h without torque discontinuity',
  },
  {
    id: 'TEST-05',
    name: 'test_thermal_throttling_derate_at_52c',
    category: 'THERMAL',
    status: 'passed',
    executionTimeMs: 4.7,
    assertion: 'Charge current linearly derates by 45% when module temp exceeds 52.0°C',
  },
  {
    id: 'TEST-06',
    name: 'test_cell_delta_v_quarantine_trigger',
    category: 'SAFETY',
    status: 'passed',
    executionTimeMs: 3.2,
    assertion: 'Isolates cell #42 when delta-V exceeds 45 mV for 3 consecutive control cycles',
  },
  {
    id: 'TEST-07',
    name: 'test_hmac_sha256_monotonic_ledger_chain',
    category: 'LEDGER_HMAC',
    status: 'passed',
    executionTimeMs: 8.4,
    assertion: 'Zero collision across 1,000,000 simulated ledger blocks with SHA-256 links',
  },
  {
    id: 'TEST-08',
    name: 'test_ledger_tamper_detection_fail_fast',
    category: 'LEDGER_HMAC',
    status: 'passed',
    executionTimeMs: 2.9,
    assertion: 'Raises TamperAuditException immediately on 1-bit corrupted payload digest',
  },
  {
    id: 'TEST-09',
    name: 'test_cloud_run_cold_start_under_800ms',
    category: 'SAFETY',
    status: 'passed',
    executionTimeMs: 12.1,
    assertion: 'Container boots and serves healthcheck /healthz in < 450 ms warm / 780 ms cold',
  },
  {
    id: 'TEST-10',
    name: 'test_openapi_json_schema_validation_strict',
    category: 'SAFETY',
    status: 'passed',
    executionTimeMs: 5.3,
    assertion: '100% strict compliance with OpenAPI 3.1 specification for 60-cell float array',
  },
];
