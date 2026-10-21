-- GHOST FACTORYOS: ALLOYDB / TIMESCALEDB HIGH-THROUGHPUT DDL
-- Target Engine: GF-T3-139 (1000Hz Telemetry Stream Partitioning)
-- Optimization: Sub-millisecond ingest, columnar compression, hypertable chunking

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- 0. CHASSIS REGISTRY
CREATE TABLE IF NOT EXISTS aero_chassis (
    chassis_id          VARCHAR(32) PRIMARY KEY,
    model_name          VARCHAR(64) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO aero_chassis (chassis_id, model_name)
VALUES ('GHOST-F1-PROTOTYPE', 'AeroDyn-RT F1 Skunkworks Chassis')
ON CONFLICT (chassis_id) DO NOTHING;

-- 1. TELEMETRY FRAMES (Partitioned Hypertable @ 1000Hz)
CREATE TABLE IF NOT EXISTS telemetry_frames (
    recorded_at         TIMESTAMPTZ NOT NULL,
    frame_seq_id        BIGINT NOT NULL,
    chassis_id          VARCHAR(32) NOT NULL DEFAULT 'GHOST-F1-PROTOTYPE' REFERENCES aero_chassis(chassis_id),
    speed_mph           NUMERIC(6, 2) NOT NULL,
    throttle_pct        NUMERIC(5, 2) NOT NULL,
    brake_bar           NUMERIC(6, 2) NOT NULL,
    ride_height_fl_mm   NUMERIC(5, 2) NOT NULL,
    ride_height_fr_mm   NUMERIC(5, 2) NOT NULL,
    ride_height_rl_mm   NUMERIC(5, 2) NOT NULL,
    ride_height_rr_mm   NUMERIC(5, 2) NOT NULL,
    pitch_angle_deg     NUMERIC(5, 3) NOT NULL,
    roll_angle_deg      NUMERIC(5, 3) NOT NULL,
    cop_front_pct       NUMERIC(5, 2) NOT NULL,
    cop_rear_pct        NUMERIC(5, 2) NOT NULL,
    downforce_total_kgf NUMERIC(7, 2) NOT NULL,
    drag_total_kgf      NUMERIC(7, 2) NOT NULL,
    active_wing_deg     NUMERIC(4, 1) NOT NULL,
    drs_state           VARCHAR(20) NOT NULL,
    ekf_residual        NUMERIC(7, 5) NOT NULL,
    loop_latency_us     INTEGER NOT NULL,
    PRIMARY KEY (recorded_at, chassis_id, frame_seq_id)
);

-- Convert to Timescale Hypertable with 1-Hour Chunks
SELECT create_hypertable('telemetry_frames', 'recorded_at', chunk_time_interval => INTERVAL '1 hour', if_not_exists => TRUE);

-- Composite Index for Real-Time Querying
CREATE INDEX IF NOT EXISTS idx_telemetry_chassis_time 
    ON telemetry_frames (chassis_id, recorded_at DESC);

-- Columnar Compression Policy (Compress older than 2 hours)
ALTER TABLE telemetry_frames SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'chassis_id',
    timescaledb.compress_orderby = 'recorded_at DESC'
);
SELECT add_compression_policy('telemetry_frames', INTERVAL '2 hours', if_not_exists => TRUE);

-- 2. ACTIVE WING COMMAND AUDIT LOG
CREATE TABLE IF NOT EXISTS wing_commands (
    command_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    chassis_id          VARCHAR(32) NOT NULL REFERENCES aero_chassis(chassis_id),
    target_angle_deg    NUMERIC(4, 1) NOT NULL,
    previous_angle_deg  NUMERIC(4, 1) NOT NULL,
    slew_rate_dps       NUMERIC(6, 2) NOT NULL,
    command_source      VARCHAR(32) NOT NULL, -- 'EKF_AIRBRAKE', 'MANUAL_DRS', 'STALL_RECOVERY'
    latency_us          INTEGER NOT NULL,
    safety_interlock_ok BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. AERO ANOMALY & STALL EVENTS
CREATE TABLE IF NOT EXISTS aero_anomalies (
    event_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    chassis_id          VARCHAR(32) NOT NULL REFERENCES aero_chassis(chassis_id),
    anomaly_type        VARCHAR(64) NOT NULL, -- 'DIFFUSER_CHOKE', 'REAR_AXLE_LIFT', 'BOTTOMING'
    cop_deviation_pct   NUMERIC(5, 2) NOT NULL,
    ride_height_min_mm  NUMERIC(5, 2) NOT NULL,
    mitigation_applied  VARCHAR(128) NOT NULL,
    auditor_hash_sha256 VARCHAR(64) NOT NULL
);

-- ROW LEVEL SECURITY HARDENING
ALTER TABLE aero_chassis ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE wing_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE aero_anomalies ENABLE ROW LEVEL SECURITY;
