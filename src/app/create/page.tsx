'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateInvoiceAction } from '@/lib/zatca/actions';
import { TEST_BUYERS, TEST_INVOICE_ITEMS } from '@/lib/zatca/test-data';

function CreateInvoiceForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    const [docType, setDocType] = useState<'388' | '381' | '383'>('388');
    const [originalInvoiceId, setOriginalInvoiceId] = useState('');
    const [reason, setReason] = useState('');
    const [buyerType, setBuyerType] = useState('corporate');
    const [items, setItems] = useState<any[]>([
        { id: '1', ...TEST_INVOICE_ITEMS.ACCOUNT_FEE }
    ]);

    useEffect(() => {
        const ref = searchParams.get('ref');
        const type = searchParams.get('type') as any;
        if (ref) setOriginalInvoiceId(ref);
        if (type && ['381', '383'].includes(type)) setDocType(type);
    }, [searchParams]);

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), name: '', unitPrice: 0, quantity: 1, vatRate: 15 }]);
    };

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(i => (i as any).id === id ? { ...i, [field]: value } : i));
    };

    const totals = items.reduce((acc, item) => {
        const lineVal = item.quantity * item.unitPrice;
        const lineVat = lineVal * (item.vatRate / 100);
        return { subtotal: acc.subtotal + lineVal, vat: acc.vat + lineVat, total: acc.total + lineVal + lineVat };
    }, { subtotal: 0, vat: 0, total: 0 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (docType !== '388' && !originalInvoiceId.trim()) {
            alert('Correction documents must reference an original invoice ID (ZATCA Rule BR-08).');
            return;
        }
        if (docType !== '388' && !reason.trim()) {
            alert('Adjustment reason is mandatory for Credit Notes and Debit Notes.');
            return;
        }

        setLoading(true);
        try {
            const existingStr = localStorage.getItem('invoices');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            const nextCounter = existing.length + 1;

            const res = await generateInvoiceAction({
                type: 'standard',
                documentType: docType,
                originalInvoiceId: docType !== '388' ? originalInvoiceId.trim() : undefined,
                creditReason: docType !== '388' ? reason.trim() : undefined,
                seller: {} as any,
                buyer: TEST_BUYERS.CORPORATE_CLIENT,
                items: items.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, vatRate: i.vatRate })),
                invoiceCounter: nextCounter
            }, 'BOJ-ORG-1001');

            if (res.success && res.data) {
                existing.push(res.data);
                localStorage.setItem('invoices', JSON.stringify(existing));
                window.location.href = `/invoices/${res.data.uuid}`;
            } else {
                alert('Generation failed:\n' + (res.error || 'Unknown error'));
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const isAdjustment = docType !== '388';
    const docTypeLabel = docType === '381' ? 'Credit Note' : docType === '383' ? 'Debit Note' : 'Tax Invoice';

    return (
        <div className="page-content animate-in">

            {/* Page Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ marginBottom: '4px' }}>Create Invoice</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        Issue a ZATCA-compliant B2B document. All documents are cryptographically signed.
                    </p>
                </div>
                <Link href="/invoices" className="btn-secondary btn-sm">← Back to Registry</Link>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '20px', alignItems: 'start' }}>

                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Document Type */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-header-label">Document Classification</span>
                                <span className="code-ref">BRD §4.1 · BR-01</span>
                            </div>
                            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="form-label">Document Type</label>
                                    <select
                                        value={docType}
                                        onChange={e => setDocType(e.target.value as any)}
                                        className="form-input form-select"
                                    >
                                        <option value="388">Tax Invoice — Standard B2B</option>
                                        <option value="381">Credit Note — Adjustment (Reduction)</option>
                                        <option value="383">Debit Note — Adjustment (Addition)</option>
                                    </select>
                                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                                        B2C Simplified Invoices are out of scope for Phase 2.
                                    </p>
                                </div>
                                <div>
                                    <label className="form-label">Buyer Profile</label>
                                    <select
                                        value={buyerType}
                                        onChange={e => setBuyerType(e.target.value)}
                                        className="form-input form-select"
                                        disabled
                                    >
                                        <option value="corporate">Registered B2B Taxpayer — Corporate</option>
                                    </select>
                                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                                        Buyer defaults to test corporate entity per BRD §7.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ─── Correction Reference (only for CN/DN) ─── */}
                        {isAdjustment && (
                            <div className="card" style={{ borderColor: 'var(--status-warning-bd)', background: 'var(--status-warning-bg)' }}>
                                <div className="card-header" style={{ background: 'transparent', borderBottomColor: 'var(--status-warning-bd)' }}>
                                    <span className="card-header-label" style={{ color: 'var(--status-warning)' }}>
                                        ⚠ Correction References — Required for {docTypeLabel}
                                    </span>
                                    <span className="code-ref">BR-08</span>
                                </div>
                                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label className="form-label">
                                            Original Invoice ID <span style={{ color: 'var(--status-error)', fontWeight: 700 }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={originalInvoiceId}
                                            onChange={e => setOriginalInvoiceId(e.target.value)}
                                            className="form-input"
                                            placeholder="e.g. INV-1234567890"
                                            required
                                            style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}
                                        />
                                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                                            Must match the Invoice ID of a previously cleared ZATCA document.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="form-label">
                                            Reason for Adjustment <span style={{ color: 'var(--status-error)', fontWeight: 700 }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={reason}
                                            onChange={e => setReason(e.target.value)}
                                            className="form-input"
                                            placeholder="e.g. Service cancellation · Overcharge correction"
                                            required
                                        />
                                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                                            This is embedded in the UBL XML as <code style={{ background: '#E5E7EB', padding: '0 4px', fontSize: '10px', borderRadius: '3px' }}>cbc:InstructionNote</code>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Line Items */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-header-label">Invoice Line Items</span>
                                <button type="button" onClick={addItem} className="btn-secondary btn-sm">+ Add Line</button>
                            </div>
                            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* Column headers */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 120px 40px', gap: '10px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                        Description
                                    </span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', textAlign: 'center' }}>
                                        Qty
                                    </span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', textAlign: 'right' }}>
                                        Unit Price (SAR)
                                    </span>
                                    <span />
                                </div>
                                <div style={{ height: 1, background: 'var(--border)' }} />
                                {items.map((item: any) => (
                                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 120px 40px', gap: '10px', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={e => updateItem(item.id, 'name', e.target.value)}
                                            className="form-input"
                                            placeholder="Service or item description"
                                            required
                                        />
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="form-input"
                                            style={{ textAlign: 'center' }}
                                            min={1} required
                                        />
                                        <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="form-input"
                                            style={{ textAlign: 'right', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}
                                            step="0.01" required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setItems(items.filter(i => (i as any).id !== item.id))}
                                            disabled={items.length === 1}
                                            style={{
                                                width: 30, height: 30, borderRadius: '4px',
                                                border: '1px solid var(--border)', background: 'transparent',
                                                color: 'var(--text-tertiary)', cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                                                fontSize: '14px', opacity: items.length === 1 ? 0.3 : 1,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Totals */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-header-label">Financial Summary</span>
                            </div>
                            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <span>Subtotal (excl. VAT)</span>
                                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                                        {totals.subtotal.toFixed(2)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <span>VAT (15%)</span>
                                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>
                                        {totals.vat.toFixed(2)}
                                    </span>
                                </div>
                                <div style={{ height: 1, background: 'var(--border)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    <span>Total Payable</span>
                                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--primary)' }}>
                                        {totals.total.toFixed(2)} <small style={{ fontSize: '11px', fontWeight: 400 }}>SAR</small>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary btn-full"
                            style={{ fontSize: '13px', padding: '11px 18px' }}
                        >
                            {loading ? 'Generating & Signing…' : `Generate ${docTypeLabel}`}
                        </button>

                        {/* Compliance Note */}
                        <div className="card" style={{ borderColor: 'var(--status-info-bd)', background: 'var(--status-info-bg)' }}>
                            <div style={{ padding: '14px 16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-info)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                    Compliance Notice
                                </div>
                                <p style={{ fontSize: '12px', color: '#1E3A5F', lineHeight: 1.5 }}>
                                    {isAdjustment
                                        ? <>
                                            This {docTypeLabel} must be linked to a previously cleared invoice per ZATCA Phase 2 guidelines <span className="code-ref" style={{ fontSize: '10px' }}>BR-08</span>. The original reference will be embedded as <code style={{ background: '#DBEAFE', padding: '0 3px', fontSize: '10px', borderRadius: '2px' }}>BillingReference</code> in the UBL 2.1 XML.
                                        </>
                                        : 'Generating this document will sign and hash it with ECDSA-256. It is then ready for submission to the ZATCA clearance gateway.'}
                                </p>
                            </div>
                        </div>

                        {/* Quick-link to existing invoices */}
                        {isAdjustment && (
                            <div className="card">
                                <div style={{ padding: '14px 16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Find Original Invoice
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                                        Look up the invoice ID from the registry and copy-paste it above.
                                    </p>
                                    <Link href="/invoices" className="btn-secondary btn-sm btn-full">
                                        Open Invoice Registry →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function CreateInvoicePage() {
    return (
        <Suspense fallback={
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
            </div>
        }>
            <CreateInvoiceForm />
        </Suspense>
    );
}
