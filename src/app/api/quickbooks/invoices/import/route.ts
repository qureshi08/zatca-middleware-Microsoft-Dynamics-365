import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getValidQBToken } from '@/lib/quickbooks/server-auth';
import { QBO_API_BASE } from '@/lib/quickbooks/fetch';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 100;

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await req.json();
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    const { data: config } = await supabaseAdmin
      .from('quickbooks_config')
      .select('realm_id, is_connected')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!config?.realm_id || !config.is_connected) {
      return NextResponse.json(
        { error: 'QuickBooks is not connected for this organization.' },
        { status: 400 }
      );
    }

    const token = await getValidQBToken(orgId);

    let startPosition = 1;
    let imported = 0;
    let preserved = 0;
    let total = 0;
    const seenIds: string[] = [];

    while (true) {
      const query = `SELECT * FROM Invoice STARTPOSITION ${startPosition} MAXRESULTS ${PAGE_SIZE}`;
      const url = `${QBO_API_BASE}/v3/company/${config.realm_id}/query?query=${encodeURIComponent(query)}&minorversion=65`;

      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`QuickBooks query failed: ${errText}`);
      }

      const json = await resp.json();
      const invoices: any[] = json.QueryResponse?.Invoice ?? [];

      if (invoices.length === 0) break;

      const allIds = invoices.map((inv) => String(inv.Id));
      const existingClearedIds = await fetchClearedIds(orgId, allIds);
      const existingTypes = await fetchExistingTypes(orgId, allIds);

      const rows = invoices
        .filter((inv) => !existingClearedIds.has(String(inv.Id)))
        .map((inv) => buildRow(orgId, inv, existingTypes.get(String(inv.Id))));

      preserved += invoices.length - rows.length;

      if (rows.length > 0) {
        const { error } = await supabaseAdmin
          .from('quickbooks_invoices')
          .upsert(rows, { onConflict: 'organization_id,qb_invoice_id' });

        if (error) throw error;
      }

      imported += rows.length;
      total += invoices.length;
      seenIds.push(...invoices.map((inv) => String(inv.Id)));

      if (invoices.length < PAGE_SIZE) break;
      startPosition += PAGE_SIZE;
    }

    return NextResponse.json({
      success: true,
      total,
      imported,
      preserved,
    });
  } catch (e: any) {
    console.error('[QB-IMPORT]:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function fetchClearedIds(orgId: string, qbIds: string[]): Promise<Set<string>> {
  if (qbIds.length === 0) return new Set();
  const { data } = await supabaseAdmin
    .from('quickbooks_invoices')
    .select('qb_invoice_id')
    .eq('organization_id', orgId)
    .eq('zatca_status', 'cleared')
    .in('qb_invoice_id', qbIds);
  return new Set((data ?? []).map((r) => r.qb_invoice_id));
}

async function fetchExistingTypes(
  orgId: string,
  qbIds: string[]
): Promise<Map<string, 'standard' | 'simplified'>> {
  if (qbIds.length === 0) return new Map();
  const { data } = await supabaseAdmin
    .from('quickbooks_invoices')
    .select('qb_invoice_id, zatca_invoice_type')
    .eq('organization_id', orgId)
    .in('qb_invoice_id', qbIds);
  const map = new Map<string, 'standard' | 'simplified'>();
  (data ?? []).forEach((r) => {
    if (r.zatca_invoice_type === 'standard' || r.zatca_invoice_type === 'simplified') {
      map.set(r.qb_invoice_id, r.zatca_invoice_type);
    }
  });
  return map;
}

function detectInvoiceType(inv: any): 'standard' | 'simplified' {
  const customFields: any[] = Array.isArray(inv.CustomField) ? inv.CustomField : [];
  const hasBuyerVat = customFields.some(
    (f) => /tax|vat|trn/i.test(f.Name ?? '') && f.StringValue
  );
  return hasBuyerVat ? 'standard' : 'simplified';
}

function buildRow(
  orgId: string,
  inv: any,
  existingType?: 'standard' | 'simplified'
) {
  return {
    organization_id: orgId,
    qb_invoice_id: String(inv.Id),
    qb_doc_number: inv.DocNumber ?? null,
    invoice_date: inv.TxnDate ?? null,
    customer_id: inv.CustomerRef?.value ?? null,
    customer_name: inv.CustomerRef?.name ?? null,
    total_amount: inv.TotalAmt ?? null,
    currency: inv.CurrencyRef?.value ?? null,
    raw_qb_payload: inv,
    // Preserve user-overridden type on re-import; heuristic only on first import
    zatca_invoice_type: existingType ?? detectInvoiceType(inv),
    updated_at: new Date().toISOString(),
  };
}
