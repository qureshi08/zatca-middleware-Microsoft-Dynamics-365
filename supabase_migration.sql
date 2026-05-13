-- Run this in your Supabase SQL Editor to add the missing columns

ALTER TABLE zatca_profiles
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS compliance_secret TEXT,
  ADD COLUMN IF NOT EXISTS production_secret TEXT;

-- Backfill existing rows that have a production_csid
UPDATE zatca_profiles
SET onboarding_step = 'production_received'
WHERE production_csid IS NOT NULL AND onboarding_step = 'none';

-- Backfill rows that have compliance_csid but no production_csid
UPDATE zatca_profiles
SET onboarding_step = 'compliance_requested'
WHERE compliance_csid IS NOT NULL AND production_csid IS NULL AND onboarding_step = 'none';
