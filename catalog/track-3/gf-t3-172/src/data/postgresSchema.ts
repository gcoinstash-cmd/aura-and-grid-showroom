/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const POSTGRES_DDL = `-- ============================================================================
-- GF-T3-172: LEXUS TX 500h F SPORT PERFORMANCE CORE
-- Partitioned PostgreSQL 16 Epoch Ledger with Cryptographic Merkle Verification
-- Target: Cloud SQL / AlloyDB / PostgreSQL 16.2
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Master Partitioned Epoch Table (Timeseries partitioned by created_at)
CREATE TABLE IF NOT EXISTS consensus_epochs_partitioned (
    epoch_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timestamp_epoch_ns BIGINT NOT NULL,
    proposer_node_id VARCHAR(64) NOT NULL,
    proposer_pubkey CHAR(64) NOT NULL,
    parent_merkle_root CHAR(64) NOT NULL,
    epoch_merkle_root CHAR(64) NOT NULL,
    
    -- DIRECT4 Dynamic Vector Attributes
    front_torque_ratio NUMERIC(5,4) NOT NULL CHECK (front_torque_ratio BETWEEN 0.2000 AND 0.7000),
    rear_torque_ratio NUMERIC(5,4) NOT NULL CHECK (rear_torque_ratio BETWEEN 0.3000 AND 0.8000),
    front_kw NUMERIC(7,2) NOT NULL CHECK (front_kw >= 0.0),
    rear_kw NUMERIC(7,2) NOT NULL CHECK (rear_kw >= 0.0),
    steer_angle_deg NUMERIC(6,2) NOT NULL,
    yaw_rate_deg_s NUMERIC(6,3) NOT NULL,
    lateral_g NUMERIC(4,2) NOT NULL,
    
    -- BFT Consensus Quorum Validation
    tx_count INT NOT NULL DEFAULT 64,
    quorum_signatures JSONB NOT NULL,
    commit_latency_us INT NOT NULL CHECK (commit_latency_us > 0),
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    quarantine_reason VARCHAR(128) NULL,

    -- Partition constraint & primary composite key
    PRIMARY KEY (epoch_id, created_at)
) PARTITION BY RANGE (created_at);

-- Partitions by Quarter
CREATE TABLE IF NOT EXISTS consensus_epochs_2026_q4 PARTITION OF consensus_epochs_partitioned
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS consensus_epochs_2027_q1 PARTITION OF consensus_epochs_partitioned
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- High-Performance Indices
CREATE INDEX IF NOT EXISTS idx_epochs_merkle_root 
    ON consensus_epochs_partitioned (epoch_merkle_root);

CREATE INDEX IF NOT EXISTS idx_epochs_proposer_id 
    ON consensus_epochs_partitioned (proposer_node_id, epoch_id DESC);

CREATE INDEX IF NOT EXISTS idx_epochs_quarantine 
    ON consensus_epochs_partitioned (is_quarantined) 
    WHERE is_quarantined = TRUE;

-- Byzantine Quarantine Audit Log Table
CREATE TABLE IF NOT EXISTS byzantine_quarantine_audit (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epoch_id BIGINT NOT NULL,
    flagged_node_id VARCHAR(64) NOT NULL,
    anomaly_type VARCHAR(64) NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    conflicting_payload JSONB NOT NULL,
    quarantined_by_node VARCHAR(64) NOT NULL
);

-- Immutable Append-Only Ledger Trigger
CREATE OR REPLACE FUNCTION enforce_immutable_epoch_commit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'SECURITY BREACH [GF-T3-172]: Immutable epoch records cannot be mutated after BFT finality.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'SECURITY BREACH [GF-T3-172]: Historical ledger epochs cannot be expunged.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_epoch_ledger ON consensus_epochs_partitioned;
CREATE TRIGGER trg_immutable_epoch_ledger
BEFORE UPDATE OR DELETE ON consensus_epochs_partitioned
FOR EACH ROW EXECUTE FUNCTION enforce_immutable_epoch_commit();

-- Merkle Root Validation Function (Deterministic SHA-256 binary tree check)
CREATE OR REPLACE FUNCTION verify_epoch_merkle_integrity(
    p_epoch_id BIGINT,
    p_telemetry_hash TEXT,
    p_direct4_hash TEXT,
    p_steer_hash TEXT,
    p_quorum_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_left_branch TEXT;
    v_right_branch TEXT;
    v_computed_root TEXT;
    v_stored_root TEXT;
BEGIN
    -- Branch 1 = SHA256(leaf_telemetry || leaf_direct4)
    v_left_branch := encode(digest(p_telemetry_hash || p_direct4_hash, 'sha256'), 'hex');
    -- Branch 2 = SHA256(leaf_steer || leaf_quorum)
    v_right_branch := encode(digest(p_steer_hash || p_quorum_hash, 'sha256'), 'hex');
    -- Root = SHA256(left_branch || right_branch)
    v_computed_root := encode(digest(v_left_branch || v_right_branch, 'sha256'), 'hex');

    SELECT epoch_merkle_root INTO v_stored_root
    FROM consensus_epochs_partitioned
    WHERE epoch_id = p_epoch_id
    LIMIT 1;

    RETURN (v_computed_root = v_stored_root);
END;
$$ LANGUAGE plpgsql;
`;

export const INITIAL_EPOCHS = [
  {
    epochNumber: 1048580,
    timestampIso: '2026-10-11T14:32:18.420Z',
    proposerId: 'node-0',
    proposerNode: 'Leader Node 0 (T24A-FTS Hybrid PCM)',
    blockHash: '0x8f4c2e91a0b34d78129c5e3170e1948bdf129034afc45b81a8c9e0134bc21789',
    merkleRoot: '0xd7a9f4381b82e45cf8733299c0119bf2e334a1795c6130de910f0814bb6012aa',
    txCount: 64,
    frontRearSplit: '70:30 (Efficiency Cruise)',
    commitLatencyMs: 0.48,
    quorumSignatures: [
      'sig_ed25519_node0_9b83a...',
      'sig_ed25519_node1_41c0e...',
      'sig_ed25519_node2_77ff2...',
    ],
    status: 'COMMITTED_FINAL' as const,
    leafHashes: {
      telemetry: '0xa11c4793f18e9a221b098ca34891bca7281',
      direct4Vector: '0xb22d5894f29fa3312c109db45902cdb8392',
      steerByWire: '0xc33e6905f30ab4423d210ec56013dec9403',
      quorumSignatures: '0xd44f7016f41bc5534e321fd67124efda514',
    },
  },
  {
    epochNumber: 1048579,
    timestampIso: '2026-10-11T14:32:17.410Z',
    proposerId: 'node-3',
    proposerNode: 'Node 3 (Rear eAxle Dynamic Direct4)',
    blockHash: '0x43b28f710e9c4d51a6108e492cb154670afb8173491c20e57261904aef72c410',
    merkleRoot: '0x39a1fe48c9032bb410972cb71a934fe01a48c2b79410ea82b40182ecbf814401',
    txCount: 64,
    frontRearSplit: '20:80 (Apex Acceleration Launch)',
    commitLatencyMs: 0.52,
    quorumSignatures: [
      'sig_ed25519_node3_88ab1...',
      'sig_ed25519_node0_22cc4...',
      'sig_ed25519_node1_19fa9...',
    ],
    status: 'COMMITTED_FINAL' as const,
    leafHashes: {
      telemetry: '0x10f84a71b29a834e09f481c9a01bce47102',
      direct4Vector: '0x21a95b82c30b945f10a592da012cde58213',
      steerByWire: '0x32ba6c93d41c056a21b603eb123def69324',
      quorumSignatures: '0x43cb7da4e52d167b32c714fc234efa70435',
    },
  },
  {
    epochNumber: 1048578,
    timestampIso: '2026-10-11T14:32:16.398Z',
    proposerId: 'node-1',
    proposerNode: 'Node 1 (Steer-by-Wire Redundancy)',
    blockHash: '0x71e982c40a5b817290c410294bfa2051610492cb410ea825102948bcae418903',
    merkleRoot: '0x6102a9fe8402b174a9c34918eab49102cba01948bcf12948e9102381bc4901ba',
    txCount: 64,
    frontRearSplit: '50:50 (Turn-In Corner Entry)',
    commitLatencyMs: 0.44,
    quorumSignatures: [
      'sig_ed25519_node1_fe901...',
      'sig_ed25519_node2_31cb4...',
      'sig_ed25519_node3_a04bf...',
    ],
    status: 'COMMITTED_FINAL' as const,
    leafHashes: {
      telemetry: '0x99a0bf21c40918e721a941bc48019af2810',
      direct4Vector: '0x88b1ce32d51029f832ba52cd59120ba3921',
      steerByWire: '0x77c2df43e62130a943cb63de60231cb4032',
      quorumSignatures: '0x66d3ea54f73241ba54dc74ef71342dc5143',
    },
  },
  {
    epochNumber: 1048577,
    timestampIso: '2026-10-11T14:32:15.385Z',
    proposerId: 'node-2',
    proposerNode: 'Node 2 (Front eAxle Inverter Core)',
    blockHash: '0x1928374650192837465019283746501928374650192837465019283746501928',
    merkleRoot: '0x9182736450918273645091827364509182736450918273645091827364509182',
    txCount: 0,
    frontRearSplit: 'REJECTED: 90:10 (Exceeds Envelope)',
    commitLatencyMs: 0.91,
    quorumSignatures: ['REJECTED_BY_QUORUM'],
    status: 'QUARANTINED' as const,
    leafHashes: {
      telemetry: '0x00000000000000000000000000000000000',
      direct4Vector: '0xbaadbaadbaadbaadbaadbaadbaadbaadbaa',
      steerByWire: '0x00000000000000000000000000000000000',
      quorumSignatures: '0x00000000000000000000000000000000000',
    },
  },
];
