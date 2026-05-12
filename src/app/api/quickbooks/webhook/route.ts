import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/quickbooks/webhook';
import { fetchInvoiceFromQuickbooks } from '@/lib/quickbooks/fetch';
import { mapQboToZatca } from '@/lib/quickbooks/mapper';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('intuit-signature') ?? '';

  // In a real server-side environment, we'd pull these from a DB.
  // For this middleware, we assume the environment variables or a specific config is set.
  const clientSecret = process.env.QB_CLIENT_SECRET || '';

  const isValid = await verifyWebhookSignature(rawBody, signature, clientSecret);
  if (!isValid && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const notifications = payload.eventNotifications ?? [];

  for (const n of notifications) {
    const realmId = n.realmId;
    const invoiceId = n.data?.entities?.find((e: any) => e.name === 'Invoice')?.id;
    if (!invoiceId) continue;

    try {
      const qboInvoice = await fetchInvoiceFromQuickbooks(realmId, invoiceId);
      const zatcaInvoice = mapQboToZatca(qboInvoice);
      
      // Submit to ZATCA Middleware
      const middlewareUrl = new URL('/api/zatca/invoices/submit', req.url);
      await fetch(middlewareUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zatcaInvoice),
      });
      
    } catch (e: any) {
      console.error('QuickBooks webhook processing error:', e);
    }
  }

  return NextResponse.json({ received: true });
}
