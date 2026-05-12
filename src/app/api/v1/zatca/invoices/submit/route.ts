import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { generateInvoiceAction } from '@/lib/zatca/actions';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/v1/zatca/invoices/submit
 *
 * The PRIMARY invoice submission endpoint for Banks.
 * - Authenticates with API Key
 * - Accepts all invoice types: standard, simplified, credit note, debit note
 * - Builds the ZATCA-compliant XML
 * - Signs cryptographically using the Bank's Production CSID
 * - Submits to ZATCA Fatoora (Clearance for Standard, Reporting for Simplified)
 * - Returns real-time ZATCA status: CLEARED, REPORTED, or REJECTED
 * - Logs the full transaction to Supabase
 *
 * Request Body:
 * {
 *   "type": "standard" | "simplified",
 *   "documentType": "388" (Invoice) | "381" (Credit Note) | "383" (Debit Note),
 *   "invoiceId": "INV-001",
 *   "buyer": { ... },
 *   "items": [ { name, quantity, unitPrice, vatCategory, vatRate } ],
 *   "originalInvoiceId": "INV-000",   // Required for Credit/Debit Notes
 *   "creditReason": "Return of goods", // Required for Credit Notes only
 * }
 */
export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });

    // 1. Authenticate – validate Bank's API Key
    const organization = await AuthService.validateAPIKey(apiKey) as any;
    if (!organization) return NextResponse.json({ error: 'Invalid or revoked API Key' }, { status: 401 });

    try {
        const body = await req.json();

        // 2. Validate required fields
        const isStandard = body.type === 'standard';
        if (!body.type || !body.invoiceId || !body.items?.length || (isStandard && !body.buyer)) {
            return NextResponse.json({
                error: `Missing required fields: type, invoiceId, items ${isStandard ? ', buyer' : ''}`
            }, { status: 400 });
        }

        // 3. Generate, Sign, and Submit to ZATCA
        const result = await generateInvoiceAction(body, organization.id);

        // 4. Log the transaction to Supabase (success AND failure)
        const { error: logError } = await supabaseAdmin.from('transaction_logs').insert({
            organization_id: organization.id,
            request_type: body.type === 'simplified' ? 'reporting' : 'clearance',
            invoice_number: body.invoiceId,
            invoice_hash: result.success ? (result.data?.hash || result.data?.uuid) : null,
            status: result.success ? 'success' : 'failure',
            response_payload: result
        });

        if (logError) {
            console.error(`[ZATCA-DB-LOG] CRITICAL ERROR for ${body.invoiceId}:`, logError.message);
        }

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 422 });
        }

        // 5. Return clean, transparent response to the Bank
        const data = result.data!;
        return NextResponse.json({
            success: true,
            invoiceId: data.id,
            uuid: data.uuid,
            zatcaStatus: data.status,        // ← "CLEARED" | "REPORTED"
            validationMessages: data.validationMessages ?? [],
            qrCode: data.qrCode,             // ← Base64 QR PNG for printing
            invoiceHash: data.hash,
            signedXml: Buffer.from(data.xml).toString('base64'), // ← Base64 XML
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
