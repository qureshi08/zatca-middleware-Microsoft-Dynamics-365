import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orgId = req.nextUrl.searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('quickbooks_invoices')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice: data });
  } catch (e: any) {
    console.error('[QB-INVOICE-DETAIL]:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { orgId, zatca_invoice_type } = await req.json();

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }
    if (zatca_invoice_type !== 'standard' && zatca_invoice_type !== 'simplified') {
      return NextResponse.json(
        { error: 'zatca_invoice_type must be "standard" or "simplified"' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('quickbooks_invoices')
      .select('zatca_status')
      .eq('id', id)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (existing.zatca_status === 'cleared') {
      return NextResponse.json(
        { error: 'Cannot change type after invoice has been cleared.' },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from('quickbooks_invoices')
      .update({
        zatca_invoice_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[QB-INVOICE-PATCH]:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
