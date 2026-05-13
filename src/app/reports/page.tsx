'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

type ReportType = 'SUMMARY' | 'STATUS' | 'ADJUSTMENT';

function getDocType(inv: any): string {
    if (inv.documentType === '381' || inv.xml?.includes('InvoiceTypeCode>381')) return 'Credit Note';
    if (inv.documentType === '383' || inv.xml?.includes('InvoiceTypeCode>383')) return 'Debit Note';
    return 'Tax Invoice';
}

function getStatus(inv: any): { label: string; pillClass: string } {
    const s = inv.zatcaStatus;
    if (s === 'CLEARED') return { label: 'CLEARED', pillClass: 'pill-success' };
    if (s === 'REPORTED') return { label: 'REPORTED', pillClass: 'pill-success' };
    if (s === 'WARNING') return { label: 'WARNING', pillClass: 'pill-warning' };
    if (s === 'REJECTED') return { label: 'REJECTED', pillClass: 'pill-error' };
    return { label: 'PENDING', pillClass: 'pill-neutral' };
}

const REPORT_META: Record<ReportType, { ref: string; title: string; desc: string }> = {
    SUMMARY: { ref: 'RPT-01', title: 'Invoice Summary Report', desc: 'Overview of all issued B2B invoices, credit and debit notes.' },
    STATUS: { ref: 'RPT-02', title: 'ZATCA Clearance Status Report', desc: 'Status tracking for all submissions to ZATCA gateway.' },
    ADJUSTMENT: { ref: 'RPT-03', title: 'Credit / Debit Note Report', desc: 'All issued credit and debit note adjustments.' },
};

function ReportsContent() {
    const sp = useSearchParams();
    const router = useRouter();
    const [reportType, setReportType] = useState<ReportType>((sp.get('type') as ReportType) || 'SUMMARY');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('invoices') || '[]');
        setInvoices(stored.reverse());
    }, []);

    useEffect(() => {
        const t = sp.get('type') as ReportType;
        if (t && REPORT_META[t]) setReportType(t);
    }, [sp]);

    const changeType = (t: ReportType) => {
        setReportType(t);
        router.replace(`/reports?type=${t}`, { scroll: false });
    };

    const rows = invoices
        .filter(inv => {
            if (reportType === 'ADJUSTMENT') {
                return inv.documentType === '381' || inv.documentType === '383' ||
                    inv.xml?.includes('InvoiceTypeCode>381') || inv.xml?.includes('InvoiceTypeCode>383');
            }
            if (reportType === 'STATUS') {
                return !!inv.zatcaStatus;
            }
            return true;
        })
        .filter(inv =>
            !search || inv.id?.toLowerCase().includes(search.toLowerCase()) ||
            inv.buyer?.toLowerCase().includes(search.toLowerCase())
        );

    const meta = REPORT_META[reportType];

    const totals = {
        count: rows.length,
        subtotal: rows.reduce((s, i) => s + (Number(i.total) || 0), 0),
        vat: rows.reduce((s, i) => s + (Number(i.vatAmount) || 0), 0),
        cleared: rows.filter(i => ['CLEARED', 'REPORTED', 'WARNING'].includes(i.zatcaStatus)).length,
        rejected: rows.filter(i => i.zatcaStatus === 'REJECTED').length,
        pending: rows.filter(i => !i.zatcaStatus || i.zatcaStatus === 'PENDING').length,
    };

    return (
        <div className="page-content animate-in">

            {/* Page Header */}
            <div className="section-header" style={{ marginBottom: '28px' }}>
                <div>
                    <h1 style={{ marginBottom: '6px' }}>Mandatory Reports</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        BRD §8.2 — Required operational and compliance reporting output.
                    </p>
                </div>
                <button onClick={() => window.print()} className="btn-secondary btn-sm">
                    🖨 Print Report
                </button>
            </div>

            {/* Report Selector Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {(Object.entries(REPORT_META) as [ReportType, typeof REPORT_META[ReportType]][]).map(([type, m]) => (
                    <button
                        key={type}
                        onClick={() => changeType(type)}
                        className={reportType === type ? 'btn-primary' : 'btn-secondary'}
                        style={{ fontSize: '12px' }}
                    >
                        <span className="code-ref" style={{ color: 'inherit', background: 'transparent', padding: 0, fontSize: '10px', letterSpacing: '0.04em' }}>
                            {m.ref}
                        </span>
                        &nbsp; {m.title.replace(' Report', '')}
                    </button>
                ))}
            </div>

            {/* Report Meta Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <span className="card-header-label">{meta.title}</span>
                    <span className="code-ref">{meta.ref}</span>
                </div>
                <div className="card-body" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{meta.desc}</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by ID or Buyer..."
                            className="form-input"
                            style={{ width: '220px', fontSize: '12px', padding: '7px 12px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="grid-5" style={{ marginBottom: '24px' }}>
                {[
                    { label: 'Records', value: totals.count, sub: 'Total rows' },
                    { label: 'Subtotal', value: totals.subtotal.toFixed(2), sub: 'SAR excl. VAT' },
                    { label: 'VAT 15%', value: totals.vat.toFixed(2), sub: 'SAR VAT amount' },
                    { label: 'Cleared', value: totals.cleared, sub: `${rows.length ? Math.round(totals.cleared / rows.length * 100) : 0}% clearance rate` },
                    { label: 'Rejected', value: totals.rejected, sub: `${rows.length ? Math.round(totals.rejected / rows.length * 100) : 0}% rejection rate` },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ fontSize: '22px', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                        <div className="stat-sub">{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card">
                {rows.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', opacity: 0.15, marginBottom: '12px' }}>📊</div>
                        <p style={{ color: 'var(--text-tertiary)' }}>No records match this report filter.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Document Type</th>
                                <th>Issue Date</th>
                                <th>Buyer</th>
                                {reportType === 'ADJUSTMENT' && <th>Adjustment Reason</th>}
                                <th style={{ textAlign: 'right' }}>Subtotal (SAR)</th>
                                <th style={{ textAlign: 'right' }}>VAT (SAR)</th>
                                <th style={{ textAlign: 'center' }}>ZATCA Status</th>
                                <th style={{ textAlign: 'right' }}>Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((inv) => {
                                const status = getStatus(inv);
                                const docLabel = getDocType(inv);
                                const docClass = docLabel === 'Credit Note' ? 'pill-error' : docLabel === 'Debit Note' ? 'pill-info' : 'pill-neutral';
                                return (
                                    <tr key={inv.uuid}>
                                        <td>
                                            <Link href={`/invoices/${inv.uuid}`}
                                                style={{ color: '#93C5FD', fontWeight: 600, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                                                {inv.id}
                                            </Link>
                                        </td>
                                        <td><span className={`pill ${docClass}`}>{docLabel}</span></td>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{inv.date || inv.issueDate}</td>
                                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{inv.buyer}</td>
                                        {reportType === 'ADJUSTMENT' && (
                                            <td style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                                                {inv.creditReason || inv.debitReason || '—'}
                                            </td>
                                        )}
                                        <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {(Number(inv.total) || 0).toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                            {(Number(inv.vatAmount) || 0).toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`pill ${status.pillClass}`}>{status.label}</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Link href={`/invoices/${inv.uuid}`} className="btn-ghost btn-sm">
                                                →
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={reportType === 'ADJUSTMENT' ? 5 : 4}
                                    style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                                    {totals.count} record{totals.count !== 1 ? 's' : ''}
                                    {totals.cleared > 0 && ` · ${totals.cleared} cleared`}
                                    {totals.rejected > 0 && ` · ${totals.rejected} rejected`}
                                </td>
                                <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {totals.subtotal.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-tertiary)' }}>
                                    {totals.vat.toFixed(2)}
                                </td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            {/* Print watermark */}
            <div className="no-print" />
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<div className="page-content"><p style={{ color: 'var(--text-tertiary)' }}>Loading reports…</p></div>}>
            <ReportsContent />
        </Suspense>
    );
}
