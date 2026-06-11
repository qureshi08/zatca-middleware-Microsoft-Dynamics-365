-- Migration: replace the Odoo ERP integration with Microsoft Dynamics 365 Business Central.
-- Run this in your Supabase SQL Editor. Safe to run on a fresh DB or an existing one.

-- 1. Create the Business Central config table.
CREATE TABLE IF NOT EXISTS bc_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    bc_tenant_id TEXT NOT NULL,
    bc_environment TEXT NOT NULL DEFAULT 'Production',
    bc_company_id TEXT NOT NULL,
    bc_client_id TEXT NOT NULL,
    bc_client_secret TEXT NOT NULL,
    bc_api_base_url TEXT,
    auto_submit BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'disconnected',
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Drop the legacy Odoo configuration table (credentials no longer used).
--    Comment this line out if you want to keep the old table around for reference.
DROP TABLE IF EXISTS odoo_config;
