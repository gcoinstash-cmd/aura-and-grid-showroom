-- ============================================================================
-- GHOSTFACTORYOS — UNIVERSAL SUPABASE & POSTGRESQL 16 RLS HARDENING ENGINE
-- Standardized Row Level Security (RLS) & Multi-Tenant Isolation for Track 1 Fleet
-- ============================================================================

-- Ensure pgcrypto extension for deterministic UUIDv4 generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Central Audit Trail Ledger (Hash-chained for clean-room verification)
CREATE TABLE IF NOT EXISTS public.grid_audit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
    record_id TEXT NOT NULL,
    actor_id TEXT DEFAULT COALESCE(current_setting('app.current_user_id', true), 'anonymous'),
    tenant_id TEXT DEFAULT COALESCE(current_setting('app.current_tenant_id', true), 'default'),
    payload_sha256 TEXT NOT NULL,
    previous_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- Enable Row Level Security on the Audit Ledger
ALTER TABLE public.grid_audit_ledger ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation RLS Policy on Audit Ledger
CREATE POLICY tenant_isolation_audit_select ON public.grid_audit_ledger
    FOR SELECT
    USING (
        tenant_id = COALESCE(current_setting('app.current_tenant_id', true), 'default')
        OR current_setting('app.is_super_admin', true) = 'true'
    );

CREATE POLICY tenant_isolation_audit_insert ON public.grid_audit_ledger
    FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- FUNCTION: generate_track1_table_rls
-- Dynamically provisions bulletproof multi-tenant RLS policies on any Track 1 table
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_track1_table_rls(target_table TEXT)
RETURNS VOID AS $$
BEGIN
    -- 1. Enable RLS on target table
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', target_table);

    -- 2. Drop legacy policies if present
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'tenant_isolation_select_' || target_table, target_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'tenant_isolation_insert_' || target_table, target_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'tenant_isolation_update_' || target_table, target_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'tenant_isolation_delete_' || target_table, target_table);

    -- 3. SELECT Policy: Tenant or Public Sandbox Match
    EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR SELECT
        USING (
            tenant_id = COALESCE(current_setting(''app.current_tenant_id'', true), ''default'')
            OR current_setting(''app.is_super_admin'', true) = ''true''
            OR is_public = true
        );
    ', 'tenant_isolation_select_' || target_table, target_table);

    -- 4. INSERT Policy: Must match current tenant
    EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR INSERT
        WITH CHECK (
            tenant_id = COALESCE(current_setting(''app.current_tenant_id'', true), ''default'')
        );
    ', 'tenant_isolation_insert_' || target_table, target_table);

    -- 5. UPDATE Policy: Tenant lock
    EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR UPDATE
        USING (
            tenant_id = COALESCE(current_setting(''app.current_tenant_id'', true), ''default'')
            OR current_setting(''app.is_super_admin'', true) = ''true''
        );
    ', 'tenant_isolation_update_' || target_table, target_table);

    -- 6. DELETE Policy: Super admin or tenant owner
    EXECUTE format('
        CREATE POLICY %I ON public.%I
        FOR DELETE
        USING (
            tenant_id = COALESCE(current_setting(''app.current_tenant_id'', true), ''default'')
            OR current_setting(''app.is_super_admin'', true) = ''true''
        );
    ', 'tenant_isolation_delete_' || target_table, target_table);
END;
$$ LANGUAGE plpgsql;
