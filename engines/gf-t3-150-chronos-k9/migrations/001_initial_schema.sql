-- Ghost FactoryOS — Engine GF-T3-150: Chronos Kinetic-9 MagLev Telemetry Rig
-- Enterprise PostgreSQL / AlloyDB Schema DDL with BRIN Indexing & Time-Series Partitioning
-- Clean-Room Certified: Apache-2.0 / MIT Dual Permissive

CREATE TABLE IF NOT EXISTS maglev_telemetry_snapshots (
    id BIGSERIAL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    velocity_kmh DOUBLE PRECISION NOT NULL,
    target_velocity_kmh DOUBLE PRECISION NOT NULL,
    accel_g DOUBLE PRECISION NOT NULL,
    lateral_displacement_mm DOUBLE PRECISION NOT NULL,
    damping_response_pct DOUBLE PRECISION NOT NULL,
    run_mode VARCHAR(32) NOT NULL,
    linear_braking BOOLEAN NOT NULL DEFAULT FALSE,
    emergency_scram BOOLEAN NOT NULL DEFAULT FALSE,
    suspension_stiffness DOUBLE PRECISION NOT NULL,
    flux_bias DOUBLE PRECISION NOT NULL,
    coil_temp_k DOUBLE PRECISION NOT NULL,
    coolant_pressure_bar DOUBLE PRECISION NOT NULL,
    helium_flow_lpm DOUBLE PRECISION NOT NULL,
    superconducting_state BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create initial monthly partition
CREATE TABLE IF NOT EXISTS maglev_telemetry_snapshots_y2026m10 PARTITION OF maglev_telemetry_snapshots
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- High-performance BRIN index on time-series telemetry
CREATE INDEX IF NOT EXISTS idx_maglev_brin ON maglev_telemetry_snapshots USING BRIN (recorded_at);
CREATE INDEX IF NOT EXISTS idx_maglev_run_mode ON maglev_telemetry_snapshots (run_mode);

-- MagLev Bogie Registry
CREATE TABLE IF NOT EXISTS maglev_bogies (
    bogie_id VARCHAR(8) PRIMARY KEY,
    bogie_name VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO maglev_bogies (bogie_id, bogie_name)
VALUES ('BOGIE-01', 'Front-Left MagLev Bogie'), ('BOGIE-02', 'Front-Right MagLev Bogie'),
       ('BOGIE-03', 'Rear-Left MagLev Bogie'), ('BOGIE-04', 'Rear-Right MagLev Bogie')
ON CONFLICT (bogie_id) DO NOTHING;

-- Quad Bogie Telemetry Airgap Log
CREATE TABLE IF NOT EXISTS bogie_airgap_telemetry (
    bogie_id VARCHAR(8) NOT NULL REFERENCES maglev_bogies(bogie_id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    gap_mm DOUBLE PRECISION NOT NULL,
    target_gap_mm DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    flux_tesla DOUBLE PRECISION NOT NULL,
    status VARCHAR(16) NOT NULL,
    PRIMARY KEY (bogie_id, timestamp)
);

-- Tamper-evident audit chain
CREATE TABLE IF NOT EXISTS maglev_audit_ledger (
    audit_id BIGSERIAL PRIMARY KEY,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type VARCHAR(64) NOT NULL,
    details JSONB NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL
);

-- ROW LEVEL SECURITY HARDENING
ALTER TABLE maglev_bogies ENABLE ROW LEVEL SECURITY;
ALTER TABLE maglev_telemetry_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bogie_airgap_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE maglev_audit_ledger ENABLE ROW LEVEL SECURITY;
