'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

/**
 * Z3C INTERACTIVE SANDBOX (v27.0 - EDITABLE ENDPOINTS)
 * Full control over URL paths and Professional Institutional Payloads.
 */

const INITIAL_API_GROUPS = [
    {
        title: "1. ZATCA Activation",
        items: [
            { id: 20, key: 'onboarding', label: 'Execute Handshake (6-in-1)', method: 'POST', endpoint: '/api/v1/zatca/onboarding', color: 'bg-green-600', desc: 'Symmetrically handshakes your node with ZATCA using pre-provisioned keys.', header: { 'x-api-key': '{master_secret}' }, body: { otp: "123456" } },
            { id: 21, key: 'status', label: 'Check Node Health', method: 'GET', endpoint: '/api/v1/zatca/status', color: 'bg-blue-400', desc: 'Verifies node registry and signature validity.', header: { 'x-api-key': '{master_secret}' }, body: null },
        ]
    },
    {
        title: "2. Transact (Standard / Credit / Debit)",
        items: [
            {
                id: 30,
                key: 'inv_standard',
                label: 'Standard Invoice Draft',
                method: 'POST',
                endpoint: '/api/v1/zatca/invoices',
                color: 'bg-green-600',
                desc: 'Generates a professional 388 VAT Invoice draft.',
                header: { 'x-api-key': '{master_secret}' },
                body: {
                    type: "standard",
                    invoiceId: "BOJ-DRAFT-1001",
                    items: [
                        { name: "Institutional Services", quantity: 1, unitPrice: 1000.0, vatRate: 15 }
                    ],
                    buyer: {
                        partyLegalEntity: { registrationName: "Authorized Buyer Co" },
                        postalAddress: { city: "Riyadh", country: "SA", streetName: "Olaya St" }
                    }
                }
            },
            { id: 31, key: 'inv_credit', label: 'Credit Note (381)', method: 'POST', endpoint: '/api/v1/zatca/invoices/credit', color: 'bg-amber-500', desc: 'Generates a 381 Credit Note.', header: { 'x-api-key': '{master_secret}' }, body: { refInvoice: "INV-1001", reason: "Return of Goods", amount: 250, items: [{ name: "Standard Credit Item", quantity: 1, unitPrice: 250, vatRate: 15 }] } },
            { id: 32, key: 'inv_debit', label: 'Debit Note (383)', method: 'POST', endpoint: '/api/v1/zatca/invoices/debit', color: 'bg-red-500', desc: 'Generates a 383 Debit Note.', header: { 'x-api-key': '{master_secret}' }, body: { refInvoice: "INV-1001", reason: "Undercharging Correction", amount: 150, items: [{ name: "Standard Debit Item", quantity: 1, unitPrice: 150, vatRate: 15 }] } },
            { id: 35, key: 'inv_submit', label: 'Submit From Draft (Live)', method: 'POST', endpoint: '/api/v1/zatca/invoices/{id-or-reference-no}/submit', color: 'bg-black', desc: 'Transitions a middleware draft to ZATCA Fatoora (Signs and Reports).', header: { 'x-api-key': '{master_secret}' }, body: null },
        ]
    },
    {
        title: "3. Inquiry & Status",
        items: [
            { id: 40, key: 'inv_status', label: 'Check Invoice Status', method: 'GET', endpoint: '/api/v1/zatca/invoices/{id-or-reference-no}', color: 'bg-gray-800', desc: 'Retrieves clearance status or signed artifacts using Invoice Number.', header: { 'x-api-key': '{master_secret}' }, body: null },
            { id: 41, key: 'pdf', label: 'Generate Official PDF', method: 'GET', endpoint: '/api/v1/zatca/invoices/{id-or-reference-no}/pdf', color: 'bg-blue-600', desc: 'Renders the signed A4 ZATCA PDF report.', header: { 'x-api-key': '{master_secret}' }, body: null },
        ]
    }
];

export default function ExplorerPage() {
    const router = useRouter();
    const { activeBank, apiKey, setApiKey, isLoading: contextLoading } = useApp();
    const [expanded, setExpanded] = useState<number | null>(20);
    const [results, setResults] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState<Record<number, boolean>>({});
    const [bodies, setBodies] = useState<Record<number, string>>({});
    const [endpoints, setEndpoints] = useState<Record<number, string>>({});
    const [localKey, setLocalKey] = useState(apiKey || '');

    useEffect(() => {
        if (!contextLoading && !activeBank) {
            router.push('/login');
        }

        // Setup initial states
        const initialBodies: Record<number, string> = {};
        const initialEndpoints: Record<number, string> = {};
        INITIAL_API_GROUPS.forEach(g => g.items.forEach(i => {
            if (i.body) initialBodies[i.id] = JSON.stringify(i.body, null, 2);
            initialEndpoints[i.id] = i.endpoint;
        }));
        setBodies(initialBodies);
        setEndpoints(initialEndpoints);

        if (apiKey) setLocalKey(apiKey);
    }, [activeBank, contextLoading, apiKey, router]);

    const executeApi = async (item: any) => {
        if (!localKey) {
            setResults(prev => ({ ...prev, [item.id]: { error: "X-API-KEY Required", details: "Node identities must be authorized via login." } }));
            return;
        }

        setLoading(prev => ({ ...prev, [item.id]: true }));
        try {
            const parsedBody = bodies[item.id] ? JSON.parse(bodies[item.id]) : {};
            const finalEndpoint = endpoints[item.id] || item.endpoint;

            const res = await fetch(finalEndpoint, {
                method: item.method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': localKey,
                    'x-org-id': activeBank?.id || ''
                },
                body: item.method === 'POST' ? JSON.stringify(parsedBody) : undefined
            });
            const data = await res.json();
            setResults(prev => ({ ...prev, [item.id]: data }));
        } catch (e: any) {
            setResults(prev => ({ ...prev, [item.id]: { error: "Execution Protocol Fault", details: e.message } }));
        }
        setLoading(prev => ({ ...prev, [item.id]: false }));
    };

    if (contextLoading) return <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase text-gray-400 font-sans tracking-[0.2em]">Restoring_Hub...</div>;

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-black pb-12">
            {/* Enterprise Header (Slim) */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center text-white font-black text-[10px]">Z</div>
                    <div>
                        <h1 className="text-[11px] font-black tracking-tight uppercase leading-none">INTERACTION HUB</h1>
                        <span className="text-[9px] font-bold text-gray-400">{activeBank?.name || 'INSTITUTIONAL_BANK'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex flex-col border-r pr-3 mr-1 text-right">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">GUARD</span>
                        <span className="text-[10px] font-bold text-blue-600 font-mono">AUTHORIZED</span>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${localKey ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-400'}`} />
                </div>
            </div>

            <div className="max-w-4xl mx-auto py-6 px-4">
                <div className="mb-6 border-l-4 border-black pl-4">
                    <h2 className="text-2xl font-black mb-1 tracking-tight">Middleware Lab</h2>
                    <p className="text-gray-400 font-medium text-xs">
                        Execute gateway requests and analyze ZATCA feedback in real-time.
                    </p>
                </div>

                <div className="space-y-8">
                    {INITIAL_API_GROUPS.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-3">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-4">
                                {group.title}
                                <div className="h-px bg-gray-100 flex-1" />
                            </h3>

                            <div className="grid grid-cols-1 gap-2">
                                {group.items.map((item) => (
                                    <div key={item.id} className={`border rounded-lg overflow-hidden transition-all ${expanded === item.id ? 'shadow-lg ring-1 ring-black/5 bg-white' : 'bg-white hover:border-gray-200'}`}>
                                        <button
                                            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                                            className={`w-full flex items-center gap-4 p-3 text-left ${expanded === item.id ? 'bg-gray-50/50' : ''}`}
                                        >
                                            <span className={`px-2 py-1 rounded text-white font-black text-[9px] uppercase tracking-wider ${item.color}`}>
                                                {item.method}
                                            </span>
                                            <div className="flex-1 flex flex-col pointer-events-none">
                                                <span className="text-[9px] font-black text-gray-300 uppercase leading-none mb-1">{item.label}</span>
                                                <code className="text-[12px] font-bold text-gray-800 font-mono italic">{endpoints[item.id] || item.endpoint}</code>
                                            </div>
                                            <div className="w-6 h-6 rounded flex items-center justify-center border border-gray-100">
                                                <span className="text-[10px] font-black text-gray-300">{expanded === item.id ? '−' : '+'}</span>
                                            </div>
                                        </button>

                                        {expanded === item.id && (
                                            <div className="p-4 bg-white border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pro">
                                                <div className="space-y-4">
                                                    {/* EDITABLE ENDPOINT BAR */}
                                                    <div className="space-y-1.5">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Endpoint Path</h4>
                                                        <div className="bg-gray-900 rounded px-3 py-2 border border-white/10 flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                className="flex-1 bg-transparent border-none outline-none text-white font-mono text-[11px] font-bold"
                                                                value={endpoints[item.id] || ''}
                                                                onChange={(e) => setEndpoints(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Request Body</h4>
                                                        <div className="bg-[#0b0e14] rounded p-3 shadow-inner">
                                                            <textarea
                                                                className="w-full h-32 bg-transparent text-[11px] font-mono text-cyan-400 outline-none resize-none no-scrollbar font-bold leading-tight"
                                                                value={bodies[item.id] || ''}
                                                                onChange={(e) => setBodies(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                placeholder="// NO BODY REQUIRED"
                                                            />
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => executeApi(item)}
                                                        disabled={loading[item.id]}
                                                        className={`w-full h-10 text-white font-black rounded-lg transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 ${loading[item.id] ? 'bg-gray-300' : 'bg-black hover:bg-gray-800'}`}
                                                    >
                                                        {loading[item.id] ? 'EXECUTING...' : 'RUN REQUEST →'}
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Server Response</h4>
                                                    <div className="bg-[#fcfcff] border border-gray-100 rounded p-4 min-h-[180px] overflow-auto shadow-inner relative max-h-[300px]">
                                                        {results[item.id] ? (
                                                            <div className="animate-pro">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <div className={`w-2 h-2 rounded-full ${results[item.id].error ? 'bg-red-500' : 'bg-green-500'}`} />
                                                                    <span className="text-[9px] font-black uppercase text-gray-900 leading-none">HTTP_REPLY_200</span>
                                                                </div>
                                                                <pre className="text-[11px] font-mono text-gray-800 leading-tight font-bold whitespace-pre-wrap break-all">
                                                                    {JSON.stringify(results[item.id], null, 2)}
                                                                </pre>
                                                            </div>
                                                        ) : (
                                                            <div className="h-full flex flex-col items-center justify-center text-gray-200 mt-10">
                                                                <p className="text-[9px] font-black uppercase tracking-widest">AWAITING_PUSH</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
