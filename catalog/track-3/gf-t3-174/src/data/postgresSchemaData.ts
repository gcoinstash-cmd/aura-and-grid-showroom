/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Heavy Overland Dynamics Platform RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * PostgreSQL 16 Partitioned Actuation Ledger DDL & Audit Triggers
 */

export const POSTGRES_LEDGER_SQL = `-- ============================================================================
-- Heavy Overland Dynamics Platform RZ 450e STEER-BY-WIRE CRYPTOGRAPHIC ACTUATION LEDGER SCHEMA
-- Target Database: PostgreSQL 16+ / AlloyDB Enterprise Edition
-- Compliance: ISO 26262 Part 8 Section 11 (Traceability & Immutable Audit)
-- Partition Strategy: Monthly Range Partitioning on recorded_at
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Main Partitioned Ledger Table
CREATE TABLE IF NOT EXISTS actuation_ledger (
    entry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    vehicle_vin VARCHAR(17) NOT NULL CHECK (length(vehicle_vin) = 17),
    monotonic_nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    
    -- Dual Resolver Telemetry (Degrees, -150.000 to +150.000)
    channel_a_deg NUMERIC(6, 3) NOT NULL CHECK (channel_a_deg BETWEEN -150.0 AND 150.0),
    channel_b_deg NUMERIC(6, 3) NOT NULL CHECK (channel_b_deg BETWEEN -150.0 AND 150.0),
    divergence_deg NUMERIC(6, 3) GENERATED ALWAYS AS (ABS(channel_a_deg - channel_b_deg)) STORED,
    
    -- Dynamic Vehicle & Actuation Quantities
    vehicle_speed_mps NUMERIC(6, 3) NOT NULL CHECK (vehicle_speed_mps >= 0.0),
    commanded_road_wheel_deg NUMERIC(6, 3) NOT NULL,
    effective_steering_ratio NUMERIC(5, 2) NOT NULL,
    haptic_torque_nm NUMERIC(5, 2) NOT NULL,
    actuation_latency_ms NUMERIC(5, 3) NOT NULL,
    
    -- ASIL-D Arbitration & Cryptographic Proof
    consensus_status VARCHAR(24) NOT NULL CHECK (consensus_status IN ('NOMINAL_ASIL_D', 'DEGRADED_FAIL_OP', 'FAULT_LOCKDOWN')),
    prev_hmac_signature CHAR(64) NOT NULL,
    hmac_signature CHAR(64) NOT NULL,

    CONSTRAINT pk_actuation_ledger PRIMARY KEY (recorded_at, entry_id)
) PARTITION BY RANGE (recorded_at);

-- 2. Range Partitions for High-Throughput Write Isolation
CREATE TABLE IF NOT EXISTS actuation_ledger_y2026m10 PARTITION OF actuation_ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS actuation_ledger_y2026m11 PARTITION OF actuation_ledger
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS actuation_ledger_y2026m12 PARTITION OF actuation_ledger
    FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- 3. Dedicated Fault Quarantine Table
CREATE TABLE IF NOT EXISTS actuation_fault_quarantine (
    fault_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_entry_id UUID NOT NULL,
    vehicle_vin VARCHAR(17) NOT NULL,
    monotonic_nonce BIGINT NOT NULL,
    fault_category VARCHAR(32) NOT NULL,
    divergence_delta NUMERIC(6, 3) NOT NULL,
    channel_a_raw NUMERIC(6, 3) NOT NULL,
    channel_b_raw NUMERIC(6, 3) NOT NULL,
    flagged_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    remediation_status VARCHAR(20) DEFAULT 'UNRESOLVED'
);

-- 4. High-Performance Indexing Strategy
-- BRIN index on timestamp provides extreme ingestion compression (1/100th RAM of B-tree)
CREATE INDEX IF NOT EXISTS idx_actuation_ledger_brin_time 
    ON actuation_ledger USING BRIN (recorded_at) WITH (pages_per_range = 128);

-- B-Tree indices on partition for zero-slip nonce checks and VIN queries
CREATE INDEX IF NOT EXISTS idx_ledger_m10_vin_nonce 
    ON actuation_ledger_y2026m10 (vehicle_vin, monotonic_nonce);

CREATE INDEX IF NOT EXISTS idx_ledger_m10_consensus 
    ON actuation_ledger_y2026m10 (consensus_status) WHERE consensus_status != 'NOMINAL_ASIL_D';

-- 5. Cross-Channel Divergence Real-Time Audit Trigger
CREATE OR REPLACE FUNCTION fn_audit_steer_divergence()
RETURNS TRIGGER AS $$
DECLARE
    computed_hmac CHAR(64);
    secret_key CONSTANT TEXT := 'GHOST_FACTORY_ASIL_D_PRECISION_LEDGER_KEY_2026';
BEGIN
    -- Verify HMAC-SHA256 signature chain integrity
    computed_hmac := encode(
        hmac(
            NEW.vehicle_vin || '|' || 
            NEW.monotonic_nonce::TEXT || '|' || 
            NEW.channel_a_deg::TEXT || '|' || 
            NEW.channel_b_deg::TEXT || '|' || 
            NEW.prev_hmac_signature,
            secret_key,
            'sha256'
        ),
        'hex'
    );

    IF NEW.hmac_signature != computed_hmac THEN
        RAISE EXCEPTION 'CRYPTOGRAPHIC TAMPER DETECTED: Invalid HMAC signature at Nonce %', NEW.monotonic_nonce;
    END IF;

    -- Cross-channel divergence threshold audit (> 0.250 deg = ASIL-D threshold breach)
    IF NEW.divergence_deg > 0.250 THEN
        INSERT INTO actuation_fault_quarantine (
            ledger_entry_id, vehicle_vin, monotonic_nonce, fault_category, divergence_delta, channel_a_raw, channel_b_raw
        ) VALUES (
            NEW.entry_id, NEW.vehicle_vin, NEW.monotonic_nonce, 'RESOLVER_DIVERGENCE_BREACH', NEW.divergence_deg, NEW.channel_a_deg, NEW.channel_b_deg
        );
        NEW.consensus_status := 'FAULT_LOCKDOWN';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_steer_divergence ON actuation_ledger;
CREATE TRIGGER trg_audit_steer_divergence
BEFORE INSERT ON actuation_ledger
FOR EACH ROW EXECUTE FUNCTION fn_audit_steer_divergence();
`;

export const MOCK_LEDGER_RECORDS = [
  {
    id: 'f83a2104-b90c-4e89-98a1-c2765a000101',
    nonce: 1048571,
    timestamp: '2026-10-11T16:15:02.108Z',
    channelA: 24.35,
    channelB: 24.33,
    divergence: 0.02,
    hmacSignature: 'a7c93e4b78912ef098ac1238914baeff52918239014bca88921049bc817364aa',
    auditPass: true,
    status: 'VERIFIED' as const,
  },
  {
    id: 'f83a2104-b90c-4e89-98a1-c2765a000102',
    nonce: 1048572,
    timestamp: '2026-10-11T16:15:02.109Z',
    channelA: 24.42,
    channelB: 24.41,
    divergence: 0.01,
    hmacSignature: '38fe92019ab921c5482bbcf9087123aa459203940149bb8829104bc817364bb',
    auditPass: true,
    status: 'VERIFIED' as const,
  },
  {
    id: 'f83a2104-b90c-4e89-98a1-c2765a000103',
    nonce: 1048573,
    timestamp: '2026-10-11T16:15:02.110Z',
    channelA: 24.50,
    channelB: 24.48,
    divergence: 0.02,
    hmacSignature: '92ba1883726abff430192ccaa18394bc8827495018274baa99281747cba83721',
    auditPass: true,
    status: 'VERIFIED' as const,
  },
  {
    id: 'f83a2104-b90c-4e89-98a1-c2765a000104',
    nonce: 1048574,
    timestamp: '2026-10-11T16:15:02.111Z',
    channelA: 24.58,
    channelB: 24.57,
    divergence: 0.01,
    hmacSignature: 'bc192847a92848cbca9182348aa8293740283749281048293847291847192834',
    auditPass: true,
    status: 'VERIFIED' as const,
  },
  {
    id: 'f83a2104-b90c-4e89-98a1-c2765a000105',
    nonce: 1048575,
    timestamp: '2026-10-11T16:15:02.112Z',
    channelA: 24.65,
    channelB: 24.64,
    divergence: 0.01,
    hmacSignature: 'ee48291049284920492049203948291847291847291847291847291847291847',
    auditPass: true,
    status: 'VERIFIED' as const,
  },
];
