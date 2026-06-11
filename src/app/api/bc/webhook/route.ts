import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { generateInvoiceAction } from '@/lib/zatca/actions';
import { supabaseAdmin } from '@/lib/supabase';
import { BusinessCentralClient } from '@/lib/bc/client';
import { generateInvoicePDF } from '@/lib/zatca/pdf/generator';

/**
 * POST /api/bc/webhook
 *
 * Microsoft Dynamics 365 Business Central integration webhook.
 * Authenticates using `x-api-key` (header or ?apiKey=).
 *
 * Request body:
 * 1. Push Mode (Full Payload) — caller already has the mapped invoice:
 * {
 *   "action": "push",
 *   "type": "standard" | "simplified",
 *   "documentType": "388" | "381" | "383",
 *   "invoiceId": "SINV-2026-0001",
 *   "buyer": { ... },
 *   "items": [ ... ],
 *   "originalInvoiceId": "SINV-2026-0000",
 *   "creditReason": "Return"
 * }
 *
 * 2. Pull & Writeback Mode (BC document GUID only):
 * {
 *   "action": "pull",
 *   "documentId": "<bc-systemId-guid>",
 *   "documentKind": "invoice" | "creditMemo"   // optional, defaults to "invoice"
 * }
 */
export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('apiKey');

    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key (header x-api-key or ?apiKey=)' }, { status: 401 });
    }

    const organization = await AuthService.validateAPIKey(apiKey) as any;
    if (!organization) {
        return NextResponse.json({ error: 'Invalid or revoked API Key' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Default to pull when a BC document id is present, otherwise push.
        const action = body.action || (body.documentId || body.systemId ? 'pull' : 'push');

        // ==========================================
        // FLOW A: PUSH MODE (Full Payload)
        // ==========================================
        if (action === 'push') {
            const isStandard = body.type === 'standard';
            if (!body.type || !body.invoiceId || !body.items?.length || (isStandard && !body.buyer)) {
                return NextResponse.json({
                    error: `Missing required fields: type, invoiceId, items${isStandard ? ', buyer' : ''}`
                }, { status: 400 });
            }

            const result = await generateInvoiceAction(body, organization.id);

            await supabaseAdmin.from('transaction_logs').insert({
                organization_id: organization.id,
                request_type: body.type === 'simplified' ? 'reporting' : 'clearance',
                invoice_number: body.invoiceId,
                invoice_hash: result.success ? (result.data?.hash || result.data?.uuid) : null,
                status: result.success ? 'success' : 'failure',
                response_payload: { ...result, body }
            });

            if (result.success && result.data) {
                const invoiceStatus = result.data.status === 'CLEARED' ? 'cleared' :
                                      result.data.status === 'REPORTED' ? 'reported' : 'cleared';
                const items = body.items || [];
                const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
                const vatTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice * (item.vatRate || 15) / 100), 0);

                await supabaseAdmin.from('invoices').upsert({
                    organization_id: organization.id,
                    invoice_number: body.invoiceId,
                    invoice_type: body.type,
                    document_type: body.documentType || '388',
                    status: invoiceStatus,
                    total_amount: subtotal + vatTotal,
                    zatca_status: result.data.status,
                    zatca_uuid: result.data.uuid,
                    qr_code: result.data.qrCode,
                    xml: result.data.xml,
                    payload: {
                        ...body,
                        total: subtotal + vatTotal,
                        vatAmount: vatTotal,
                        subtotal,
                        uuid: result.data.uuid,
                        hash: result.data.hash,
                        zatcaStatus: result.data.status,
                        qrCode: result.data.qrCode,
                        xml: result.data.xml,
                    },
                }, {
                    onConflict: 'organization_id, invoice_number'
                });
            }

            if (!result.success) {
                return NextResponse.json({
                    success: false,
                    error: result.error,
                    validationMessages: result.validationMessages || []
                }, { status: 422 });
            }

            const data = result.data!;
            return NextResponse.json({
                success: true,
                invoiceId: data.id,
                uuid: data.uuid,
                zatcaStatus: data.status,
                documentType: body.documentType || '388',
                documentTypeLabel:
                    body.documentType === '381' ? 'Credit Note' :
                    body.documentType === '383' ? 'Debit Note' :
                    'Tax Invoice',
                invoiceType: body.type,
                originalInvoiceId: body.originalInvoiceId || null,
                validationMessages: data.validationMessages ?? [],
                qrCode: data.qrCode,
                invoiceHash: data.hash,
                signedXml: Buffer.from(data.xml).toString('base64'),
                timestamp: new Date().toISOString()
            });
        }

        // ==========================================
        // FLOW B: PULL & WRITEBACK MODE
        // ==========================================
        if (action === 'pull') {
            const documentId = body.documentId || body.systemId;
            const documentKind: 'invoice' | 'creditMemo' =
                body.documentKind === 'creditMemo' ? 'creditMemo' : 'invoice';

            if (!documentId) {
                return NextResponse.json({ error: 'Missing documentId for pull action' }, { status: 400 });
            }

            // 1. Load BC connection settings.
            const { data: config, error: configError } = await supabaseAdmin
                .from('bc_config')
                .select('*')
                .eq('organization_id', organization.id)
                .maybeSingle();

            if (configError || !config) {
                return NextResponse.json({
                    error: 'Business Central integration is not configured. Please complete setup in the dashboard.'
                }, { status: 400 });
            }

            // 2. Initialize BC client.
            const bc = new BusinessCentralClient({
                tenantId: config.bc_tenant_id,
                environment: config.bc_environment,
                companyId: config.bc_company_id,
                clientId: config.bc_client_id,
                clientSecret: config.bc_client_secret,
                apiBaseUrl: config.bc_api_base_url || undefined,
            });

            // 3. Fetch and map the document from BC.
            let bcInvoice;
            try {
                bcInvoice = await bc.getInvoice(String(documentId), documentKind);
            } catch (err: any) {
                return NextResponse.json({
                    error: `Failed to fetch document from Business Central: ${err.message}`
                }, { status: 422 });
            }

            // 4. Submit to ZATCA.
            const result = await generateInvoiceAction(bcInvoice, organization.id);

            await supabaseAdmin.from('transaction_logs').insert({
                organization_id: organization.id,
                request_type: bcInvoice.type === 'simplified' ? 'reporting' : 'clearance',
                invoice_number: bcInvoice.invoiceId,
                invoice_hash: result.success ? (result.data?.hash || result.data?.uuid) : null,
                status: result.success ? 'success' : 'failure',
                response_payload: { ...result, body: bcInvoice }
            });

            if (result.success && result.data) {
                const invoiceStatus = result.data.status === 'CLEARED' ? 'cleared' :
                                      result.data.status === 'REPORTED' ? 'reported' : 'cleared';
                const items = bcInvoice.items || [];
                const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
                const vatTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice * (item.vatRate || 15) / 100), 0);

                await supabaseAdmin.from('invoices').upsert({
                    organization_id: organization.id,
                    invoice_number: bcInvoice.invoiceId,
                    invoice_type: bcInvoice.type,
                    document_type: bcInvoice.documentType || '388',
                    status: invoiceStatus,
                    total_amount: subtotal + vatTotal,
                    zatca_status: result.data.status,
                    zatca_uuid: result.data.uuid,
                    qr_code: result.data.qrCode,
                    xml: result.data.xml,
                    payload: {
                        ...bcInvoice,
                        total: subtotal + vatTotal,
                        vatAmount: vatTotal,
                        subtotal,
                        uuid: result.data.uuid,
                        hash: result.data.hash,
                        zatcaStatus: result.data.status,
                        qrCode: result.data.qrCode,
                        xml: result.data.xml,
                    },
                }, {
                    onConflict: 'organization_id, invoice_number'
                });
            }

            // 5. Write results back to BC.
            try {
                if (result.success && result.data) {
                    let pdfBase64: string | undefined;
                    try {
                        const pdfBuffer = await generateInvoicePDF({
                            invoice: {
                                invoice_number: bcInvoice.invoiceId,
                                invoice_type: bcInvoice.type,
                                status: (result.data.status === 'CLEARED' || result.data.status === 'REPORTED') ? 'cleared' : 'submitted',
                                created_at: new Date().toISOString(),
                                payload: {
                                    ...bcInvoice,
                                    seller: result.data.seller,
                                    items: bcInvoice.items || [],
                                }
                            },
                            qrCode: result.data.qrCode,
                            hash: result.data.hash
                        });
                        pdfBase64 = pdfBuffer.toString('base64');
                    } catch (pdfErr: any) {
                        console.error(`[BC Webhook PDF Gen Error] Document ${documentId}:`, pdfErr.message);
                    }

                    const xmlBase64 = result.data.xml ? Buffer.from(result.data.xml).toString('base64') : undefined;

                    await bc.writebackStatus(String(documentId), documentKind, {
                        status: (result.data.status === 'CLEARED' || result.data.status === 'REPORTED') ? 'cleared' : 'submitted',
                        uuid: result.data.uuid,
                        qrCode: result.data.qrCode,
                        pdfBase64,
                        xmlBase64,
                        documentType: bcInvoice.documentType,
                        originalInvoiceId: bcInvoice.originalInvoiceId,
                        invoiceNumber: bcInvoice.invoiceId,
                    });
                } else {
                    await bc.writebackStatus(String(documentId), documentKind, {
                        status: 'failed',
                        error: result.error || 'ZATCA Clearance failed',
                        invoiceNumber: bcInvoice.invoiceId,
                    });
                }
            } catch (writeError: any) {
                console.error(`[BC Writeback Error] Document ${documentId}:`, writeError.message);
                return NextResponse.json({
                    success: result.success,
                    uuid: result.data?.uuid,
                    zatcaStatus: result.data?.status,
                    writebackSuccess: false,
                    writebackError: writeError.message,
                    validationMessages: result.data?.validationMessages || []
                });
            }

            if (!result.success) {
                return NextResponse.json({
                    success: false,
                    error: result.error,
                    validationMessages: result.validationMessages || []
                }, { status: 422 });
            }

            const data = result.data!;
            return NextResponse.json({
                success: true,
                invoiceId: data.id,
                uuid: data.uuid,
                zatcaStatus: data.status,
                documentType: bcInvoice.documentType,
                documentTypeLabel:
                    bcInvoice.documentType === '381' ? 'Credit Note' :
                    bcInvoice.documentType === '383' ? 'Debit Note' :
                    'Tax Invoice',
                invoiceType: bcInvoice.type,
                originalInvoiceId: bcInvoice.originalInvoiceId || null,
                writebackSuccess: true,
                validationMessages: data.validationMessages ?? [],
                qrCode: data.qrCode,
                invoiceHash: data.hash,
                timestamp: new Date().toISOString()
            });
        }

        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
