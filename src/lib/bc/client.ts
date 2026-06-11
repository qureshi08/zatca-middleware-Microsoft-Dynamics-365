// MICROSOFT DYNAMICS 365 BUSINESS CENTRAL CLIENT (Z3C v10.0)
// Talks to Business Central over the standard REST API v2.0 using an
// OAuth 2.0 client-credentials (service-to-service) token from Microsoft Entra ID.
//
// API base:  https://api.businesscentral.dynamics.com/v2.0/{tenantId}/{environment}/api/v2.0
// Token URL: https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
// Scope:     https://api.businesscentral.dynamics.com/.default

export interface BusinessCentralConfig {
    tenantId: string;       // Microsoft Entra (Azure AD) tenant GUID or domain
    environment: string;    // BC environment name, e.g. "Production" or "Sandbox"
    companyId: string;      // BC Company GUID
    clientId: string;       // Azure App Registration (client) ID
    clientSecret?: string;  // Azure App Registration client secret
    apiBaseUrl?: string;    // Optional override (defaults to global BC endpoint)
}

const DEFAULT_API_HOST = 'https://api.businesscentral.dynamics.com';
const LOGIN_HOST = 'https://login.microsoftonline.com';
const SCOPE = 'https://api.businesscentral.dynamics.com/.default';

export class BusinessCentralClient {
    private tenantId: string;
    private environment: string;
    private companyId: string;
    private clientId: string;
    private clientSecret?: string;
    private apiHost: string;
    private accessToken: string | null = null;
    private tokenExpiry = 0;

    constructor(config: BusinessCentralConfig) {
        this.tenantId = config.tenantId.trim();
        this.environment = config.environment.trim();
        this.companyId = config.companyId.trim();
        this.clientId = config.clientId.trim();
        this.clientSecret = config.clientSecret;
        this.apiHost = (config.apiBaseUrl?.replace(/\/$/, '') || DEFAULT_API_HOST);
    }

    private get apiBase(): string {
        return `${this.apiHost}/v2.0/${this.tenantId}/${this.environment}/api/v2.0`;
    }

    /** True when this looks like a local mock/sandbox config (no real Azure secret). */
    private get isMock(): boolean {
        return (
            !this.clientSecret ||
            this.clientSecret === 'mock' ||
            this.tenantId === 'mock' ||
            this.environment.toLowerCase() === 'mock'
        );
    }

    /**
     * Acquires (and caches) an OAuth 2.0 bearer token via the client-credentials flow.
     */
    async authenticate(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry - 60_000) {
            return this.accessToken;
        }

        if (!this.clientSecret) {
            throw new Error('Business Central client secret is required for authentication.');
        }

        const tokenUrl = `${LOGIN_HOST}/${this.tenantId}/oauth2/v2.0/token`;
        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            scope: SCOPE,
        });

        const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
            cache: 'no-store',
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.access_token) {
            const detail = json.error_description || json.error || `${res.status} ${res.statusText}`;
            throw new Error(`Entra ID token request failed: ${detail}`);
        }

        this.accessToken = json.access_token;
        this.tokenExpiry = Date.now() + (json.expires_in ?? 3600) * 1000;
        return this.accessToken!;
    }

    /**
     * Issues an authenticated request against the BC REST API.
     * `path` is relative to the company endpoint, e.g. `salesInvoices(<id>)`.
     */
    private async apiRequest(
        method: string,
        path: string,
        body?: unknown,
        extraHeaders: Record<string, string> = {}
    ): Promise<any> {
        const token = await this.authenticate();
        const url = `${this.apiBase}/companies(${this.companyId})/${path}`;

        const res = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                ...extraHeaders,
            },
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        });

        if (res.status === 204) return null;

        const text = await res.text();
        const json = text ? JSON.parse(text) : null;

        if (!res.ok) {
            const message = json?.error?.message || `${res.status} ${res.statusText}`;
            throw new Error(`Business Central API error (${method} ${path}): ${message}`);
        }

        return json;
    }

    /**
     * Verifies credentials and company access by acquiring a token and listing the company.
     */
    async testConnection(): Promise<{ success: boolean; companyName?: string; error?: string }> {
        if (this.isMock) {
            return { success: true, companyName: 'Mock Company (Sandbox)' };
        }
        try {
            await this.authenticate();
            const company = await this.apiRequest('GET', '?$select=name');
            return { success: true, companyName: company?.name };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Lists companies available in the environment (handy for picking the Company GUID).
     */
    async listCompanies(): Promise<Array<{ id: string; name: string }>> {
        if (this.isMock) {
            return [{ id: '00000000-0000-0000-0000-000000000001', name: 'Mock Company (Sandbox)' }];
        }
        const token = await this.authenticate();
        const url = `${this.apiBase}/companies?$select=id,name,displayName`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(json?.error?.message || `Failed to list companies: ${res.status}`);
        }
        return (json.value || []).map((c: any) => ({ id: c.id, name: c.displayName || c.name }));
    }

    /**
     * Returns a mocked invoice payload shaped like a mapped ZATCA input (for sandbox/testing).
     */
    private mockInvoice(documentId: string, kind: 'invoice' | 'creditMemo'): any {
        const documentType = kind === 'creditMemo' ? '381' : '388';
        return {
            type: 'standard',
            documentType,
            invoiceId: kind === 'creditMemo' ? 'SCM-2026-0001' : 'SINV-2026-0001',
            buyer: this.mapCustomer({
                displayName: 'Test Buyer LLC',
                taxRegistrationNumber: '399999999900003',
                addressLine1: 'King Fahd Road',
                city: 'Riyadh',
                postalCode: '11564',
                country: 'SA',
            }),
            items: [
                { name: 'Consulting Services', quantity: 1, unitPrice: 1000, vatCategory: 'S', vatRate: 15 },
            ],
            bcRaw: { id: documentId, kind },
            ...(documentType === '381' && {
                originalInvoiceId: 'SINV-2026-0000',
                creditReason: 'Returned goods',
            }),
        };
    }

    /** Maps a BC customer record to the buyer party shape consumed by the ZATCA builder. */
    private mapCustomer(customer: any): any {
        const vat = customer?.taxRegistrationNumber || customer?.vatRegistrationNo || '';
        const country = (customer?.country || 'SA').toUpperCase();
        const city = customer?.city || 'Riyadh';
        return {
            partyIdentification: { id: vat || 'UNREGISTERED', schemeID: vat ? 'TXID' : 'NAT' },
            postalAddress: {
                streetName: customer?.addressLine1 || 'Street Address',
                buildingNumber: '1000',
                citySubdivisionName: city,
                cityName: city,
                postalZone: customer?.postalCode || '11564',
                country,
            },
            partyTaxScheme: { companyID: vat },
            partyLegalEntity: { registrationName: customer?.displayName || 'Walk-in Customer' },
            // Flat fields kept for backward compatibility with the PDF/UI layers.
            name: customer?.displayName || 'Walk-in Customer',
            vatNumber: vat,
            street: customer?.addressLine1 || 'Street Address',
            building: '1000',
            city,
            postalCode: customer?.postalCode || '11564',
            country,
        };
    }

    /** Maps BC sales document lines to ZATCA line items. */
    private mapLines(lines: any[]): any[] {
        const items: any[] = [];
        for (const line of lines || []) {
            // Skip comments / non-item lines and zero-quantity rows.
            const quantity = Number(line.quantity) || 0;
            if (quantity <= 0) continue;
            if (line.lineType && !['Item', 'Resource', 'G/L Account', 'Account', 'Fixed Asset'].includes(line.lineType)) {
                continue;
            }
            items.push({
                name: line.description || 'Sales Item',
                quantity,
                unitPrice: Number(line.unitPrice) || 0,
                vatCategory: 'S',
                vatRate: line.taxPercent != null ? Number(line.taxPercent) : 15,
            });
        }
        return items;
    }

    /**
     * Pulls a Business Central document (sales invoice or credit memo) and maps it
     * to the SimpleInvoiceInput shape used by the ZATCA engine.
     *
     * @param documentId  BC document GUID (systemId of the sales invoice/credit memo).
     * @param kind        'invoice' (default) or 'creditMemo'.
     */
    async getInvoice(documentId: string, kind: 'invoice' | 'creditMemo' = 'invoice'): Promise<any> {
        if (this.isMock) {
            return this.mockInvoice(documentId, kind);
        }

        const entity = kind === 'creditMemo' ? 'salesCreditMemos' : 'salesInvoices';
        const linesNav = kind === 'creditMemo' ? 'salesCreditMemoLines' : 'salesInvoiceLines';

        const doc = await this.apiRequest(
            'GET',
            `${entity}(${documentId})?$expand=${linesNav},customer`
        );

        if (!doc) {
            throw new Error(`Document ${documentId} not found in Business Central (${entity}).`);
        }

        const customer = doc.customer || {};
        const buyer = this.mapCustomer({
            displayName: doc.customerName || customer.displayName,
            taxRegistrationNumber: customer.taxRegistrationNumber || customer.vatRegistrationNo,
            addressLine1: customer.addressLine1,
            city: customer.city,
            postalCode: customer.postalCode,
            country: customer.country,
        });

        const items = this.mapLines(doc[linesNav]);

        // B2B (standard) when the buyer carries a VAT registration; otherwise B2C (simplified).
        const isB2B = !!buyer.vatNumber;
        const type = isB2B ? 'standard' : 'simplified';
        const documentType = kind === 'creditMemo' ? '381' : '388';

        const result: any = {
            type,
            documentType,
            invoiceId: doc.number || `BC-${documentId}`,
            issueDate: doc.invoiceDate || doc.documentDate,
            currency: doc.currencyCode || 'SAR',
            buyer,
            items,
            bcRaw: { id: documentId, number: doc.number, kind, entity },
        };

        if (documentType === '381') {
            // BC credit memos may reference the original via correctedInvoiceNo / appliesToInvoiceNo.
            const original = doc.correctedInvoiceNo || doc.appliesToInvoiceNo || doc.externalDocumentNumber || '';
            result.originalInvoiceId = original || 'INV-0000';
            result.creditReason = doc.reasonCode || 'Credit Note';
        }

        return result;
    }

    /**
     * Writes ZATCA compliance results back to the Business Central document.
     *
     * BC custom fields require an AL extension, so this writes back best-effort:
     *   1. Posts the QR/UUID/status as a comment line on the document (sales*Comments API).
     *   2. Uploads the signed XML and compliance PDF as document attachments.
     * Each step degrades gracefully — a failure is logged but does not abort the others.
     */
    async writebackStatus(
        documentId: string,
        kind: 'invoice' | 'creditMemo',
        data: {
            status: 'cleared' | 'failed' | 'submitted';
            uuid?: string;
            qrCode?: string;
            error?: string;
            pdfBase64?: string;
            xmlBase64?: string;
            documentType?: string;
            originalInvoiceId?: string;
            invoiceNumber?: string;
        }
    ): Promise<boolean> {
        if (this.isMock) {
            console.log(`[BC mock] writeback ${data.status} for ${kind} ${documentId} (uuid=${data.uuid})`);
            return true;
        }

        const docTypeLabel =
            data.documentType === '381' ? 'Credit Note (381)' :
            data.documentType === '383' ? 'Debit Note (383)' :
            'Tax Invoice (388)';

        const summary =
            data.status === 'cleared' || data.status === 'submitted'
                ? `ZATCA ${docTypeLabel} ${data.status === 'cleared' ? 'Cleared' : 'Reported'}. UUID: ${data.uuid || ''}` +
                  (data.originalInvoiceId ? ` | Original: ${data.originalInvoiceId}` : '')
                : `ZATCA submission failed: ${data.error || 'unknown error'}`;

        // 1. Attach signed XML + compliance PDF to the BC document.
        if ((data.status === 'cleared' || data.status === 'submitted') && (data.pdfBase64 || data.xmlBase64)) {
            try {
                if (data.pdfBase64) {
                    await this.uploadAttachment(documentId, kind, `ZATCA_Cleared_${data.invoiceNumber || documentId}.pdf`, data.pdfBase64, 'application/pdf');
                }
                if (data.xmlBase64) {
                    await this.uploadAttachment(documentId, kind, `ZATCA_Signed_${data.invoiceNumber || documentId}.xml`, data.xmlBase64, 'application/xml');
                }
            } catch (attachErr: any) {
                console.warn('[BC] Failed to upload attachment(s):', attachErr.message);
            }
        }

        // 2. Record a status comment line on the document.
        try {
            const commentsEntity = kind === 'creditMemo' ? 'salesCreditMemos' : 'salesInvoices';
            await this.apiRequest('POST', `${commentsEntity}(${documentId})/comments`, {
                comment: summary.slice(0, 250),
            });
        } catch (commentErr: any) {
            console.warn('[BC] Failed to post status comment:', commentErr.message);
        }

        return true;
    }

    /**
     * Uploads a base64 document via the Business Central attachments API.
     * Creates the attachment record, then PATCHes the binary content.
     */
    private async uploadAttachment(
        documentId: string,
        kind: 'invoice' | 'creditMemo',
        fileName: string,
        contentBase64: string,
        mimeType: string
    ): Promise<void> {
        const parentType = kind === 'creditMemo' ? 'Sales_Credit_Memo' : 'Sales_Invoice';

        // 1. Create the attachment metadata record.
        const created = await this.apiRequest('POST', 'attachments', {
            parentId: documentId,
            parentType,
            fileName,
            byteSize: Buffer.from(contentBase64, 'base64').length,
        });

        if (!created?.id) {
            throw new Error('Attachment record creation returned no id.');
        }

        // 2. Upload the binary content (PATCH the attachmentContent media stream).
        const token = await this.authenticate();
        const url = `${this.apiBase}/companies(${this.companyId})/attachments(${created.id})/attachmentContent`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': mimeType,
                'If-Match': '*',
            },
            body: Buffer.from(contentBase64, 'base64'),
            cache: 'no-store',
        });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(`Attachment content upload failed: ${res.status} ${t}`);
        }
    }
}
