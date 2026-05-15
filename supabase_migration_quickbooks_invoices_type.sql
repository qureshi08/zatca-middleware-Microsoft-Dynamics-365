-- Run this in your Supabase SQL Editor.
-- Adds B2B (standard / clearance) vs B2C (simplified / reporting) classification
-- to imported QuickBooks invoices.

ALTER TABLE quickbooks_invoices
  ADD COLUMN IF NOT EXISTS zatca_invoice_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (zatca_invoice_type IN ('standard', 'simplified'));
