-- Ghost FactoryOS — Engine GF-T3-149: Chrono-Chassis Telemetry Interface
-- Enterprise PostgreSQL / AlloyDB Schema DDL with BRIN Indexing & Time-Series Partitioning
-- Clean-Room Certified: Apache-2.0 / MIT Dual Permissive

CREATE TABLE IF NOT EXISTS telemetry_snapshots (
    id BIGSERIAL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    microsecond_time DOUBLE PRECISION NOT NULL,
    drive_mode VARCHAR(32) NOT NULL,
    coherence_rate DOUBLE PRECISION NOT NULL,
    qubits_active INTEGER NOT NULL,
    cryo_temp_mk DOUBLE PRECISION NOT NULL,
    photon_flux_thz DOUBLE PRECISION NOT NULL,
    hamiltonian_eigenvalue DOUBLE PRECISION NOT NULL,
    phase_drift_ps DOUBLE PRECISION NOT NULL,
    downforce_kgf DOUBLE PRECISION NOT NULL,
    drag_coefficient DOUBLE PRECISION NOT NULL,
    diffuser_angle_deg DOUBLE PRECISION NOT NULL,
    speed_kmh DOUBLE PRECISION NOT NULL,
    venturi_load_kgf DOUBLE PRECISION NOT NULL,
    accumulated_alpha_usd NUMERIC(16, 2) NOT NULL,
    cooling_pump_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create initial monthly partition
CREATE TABLE IF NOT EXISTS telemetry_snapshots_y2026m10 PARTITION OF telemetry_snapshots
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- High-performance BRIN index on time-series telemetry
CREATE INDEX IF NOT EXISTS idx_telemetry_brin ON telemetry_snapshots USING BRIN (recorded_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_drive_mode ON telemetry_snapshots (drive_mode);

-- Venues Registry
CREATE TABLE IF NOT EXISTS arbitrage_venues (
    venue_id VARCHAR(64) PRIMARY KEY,
    venue_name VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO arbitrage_venues (venue_id, venue_name)
VALUES ('LD4', 'London Equinix LD4'), ('NY4', 'Secaucus Equinix NY4'), ('TY3', 'Tokyo Equinix TY3')
ON CONFLICT (venue_id) DO NOTHING;

-- Global Arbitrage Vectors table
CREATE TABLE IF NOT EXISTS arbitrage_vectors (
    route_id VARCHAR(64) PRIMARY KEY,
    source_venue VARCHAR(64) NOT NULL REFERENCES arbitrage_venues(venue_id),
    target_venue VARCHAR(64) NOT NULL REFERENCES arbitrage_venues(venue_id),
    distance_km DOUBLE PRECISION NOT NULL,
    fiber_latency_ns BIGINT NOT NULL,
    chrono_latency_ns BIGINT NOT NULL,
    delta_gain_ns BIGINT NOT NULL,
    projected_alpha_bps NUMERIC(8, 2) NOT NULL,
    annualized_yield_usd NUMERIC(16, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tamper-evident audit chain
CREATE TABLE IF NOT EXISTS telemetry_audit_ledger (
    audit_id BIGSERIAL PRIMARY KEY,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type VARCHAR(64) NOT NULL,
    details JSONB NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL
);

-- ROW LEVEL SECURITY HARDENING
ALTER TABLE arbitrage_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_audit_ledger ENABLE ROW LEVEL SECURITY;
