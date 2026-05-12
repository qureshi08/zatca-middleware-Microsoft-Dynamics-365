'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTransactionLogsAction } from '@/lib/zatca/actions';
import { getOrganizationsAction } from '@/lib/zatca/onboarding';
import Link from 'next/link';

export default function ApiLogsPage() {
    const [orgs, setOrgs] = useState<any[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [logs, setLogs] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'CLEARED' | 'REPORTED' | 'ERROR'>('ALL');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'response' | 'xml'>('response');

    // Fetch orgs first
    useEffect(() => {
        getOrganizationsAction().then(data => {
            setOrgs(data);
            if (data.length > 0 && !selectedOrgId) {
                setSelectedOrgId(data[0].id);
            }
        });
    }, []);

    const fetchLogs = useCallback(async () => {
        if (!selectedOrgId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const data = await getTransactionLogsAction(selectedOrgId);
        setLogs(data);
        setLoading(false);
    }, [selectedOrgId]);

    useEffect(() => {
        if (selectedOrgId) {
            fetchLogs();
            const id = setInterval(fetchLogs, 5000);
            return () => clearInterval(id);
        }
    }, [selectedOrgId, fetchLogs]);

    const filtered = logs.filter(log => {
        const status = log.response_payload?.status || log.status;

        if (filter === 'CLEARED' && status !== 'CLEARED') return false;
        if (filter === 'REPORTED' && status !== 'REPORTED') return false;
        if (filter === 'ERROR' && status !== 'REJECTED' && log.status !== 'failure') return false;

        if (search) {
            const term = search.toLowerCase();
            if (!log.invoice_number?.toLowerCase().includes(term) &&
                !log.invoice_hash?.toLowerCase().includes(term) &&
                !log.request_type?.toLowerCase().includes(term)) return false;
        }
        return true;
    });

    const renderJson = (val: any) => {
        try { return JSON.stringify(typeof val === 'string' ? JSON.parse(val) : val, null, 2); }
        catch { return String(val); }
    };

    const totalErrors = logs.filter(l => l.status === 'failure' || l.response_payload?.status === 'REJECTED').length;
    const totalSuccess = logs.length - totalErrors;

    return (
        <div className="min-h-screen bg-[#FBFBFD] text-[#1d1d1f] p-8">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-[#86868b] mb-2 uppercase tracking-wide">
                            <Link href="/" className="hover:text-[#0071e3]">Dashboard</Link>
                            <span>/</span>
                            <span>Operation Trace</span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">API Traffic <span className="text-[#0071e3]">Logs</span></h1>
                        <p className="mt-2 text-[#86868b] text-lg">Live multi-tenant transaction audit and compliance trace</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Org Selector */}
                        <select
                            value={selectedOrgId}
                            onChange={(e) => {
                                setSelectedOrgId(e.target.value);
                                setLogs([]);
                                setSelected(null);
                            }}
                            className="bridge-input py-2 px-4 shadow-sm border border-[#d2d2d7]"
                        >
                            <option value="" disabled>Select Bank...</option>
                            {orgs.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                        <button onClick={fetchLogs} className="bridge-btn py-2 px-4 text-sm whitespace-nowrap bg-white border border-[#d2d2d7] text-black">↻ Refresh</button>
                    </div>
                </header>

                {/* Filters */}
                <div className="flex gap-2 mb-6 items-center">
                    {(['ALL', 'CLEARED', 'REPORTED', 'ERROR'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f ? 'bg-[#1d1d1f] text-white shadow-md' : 'bg-white text-[#86868b] border border-[#d2d2d7] hover:bg-gray-50'}`}>
                            {f}
                        </button>
                    ))}
                    <div className="ml-auto">
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search invoice number or hash..."
                            className="bridge-input py-2 px-4 text-sm w-[300px]" />
                    </div>
                </div>

                {/* Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6" style={{ height: '600px' }}>

                    {/* Log List */}
                    <div className="bridge-card p-0 flex flex-col overflow-hidden">
                        <div className="bg-[#f5f5f7] p-4 font-bold text-sm border-b uppercase tracking-wider text-[#86868b] flex justify-between">
                            <span>Transaction Stream</span>
                            <span>{filtered.length} entries</span>
                        </div>

                        <div className="flex-1 overflow-auto bg-white p-2">
                            {loading && logs.length === 0 ? (
                                <div className="text-center p-8 text-[#86868b] italic">Loading logs...</div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center p-8 text-[#86868b] italic">No logs match your criteria.</div>
                            ) : (
                                <div className="space-y-2">
                                    {filtered.map((log) => {
                                        const status = log.response_payload?.status || log.status;
                                        const isError = log.status === 'failure' || status === 'REJECTED';
                                        let statusColor = 'bg-gray-100 text-gray-800';

                                        if (status === 'CLEARED') statusColor = 'bg-green-100 text-green-800 border-green-200';
                                        else if (status === 'REPORTED') statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                                        else if (isError) statusColor = 'bg-red-100 text-red-800 border-red-200';

                                        return (
                                            <div
                                                key={log.id}
                                                onClick={() => setSelected(log)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selected?.id === log.id ? 'border-[#0071e3] bg-[#0071e3]/5 ring-2 ring-[#0071e3]/20' : 'border-[#d2d2d7] hover:border-gray-400 bg-white'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                                                        {status}
                                                    </span>
                                                    <span className="text-[10px] text-[#86868b] font-mono">
                                                        {new Date(log.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <div className="font-semibold text-sm mb-1">{log.request_type.toUpperCase().replace('_', ' ')}</div>
                                                <div className="text-xs text-[#86868b] font-mono truncate">{log.invoice_number || log.invoice_hash || 'Unknown ID'}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inspector */}
                    <div className="bridge-card p-0 flex flex-col overflow-hidden bg-[#1d1d1f] text-white">
                        {!selected ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[#86868b]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <h3 className="text-lg font-bold text-white mb-2">Select a transaction</h3>
                                <p>Click any log entry to view the full cryptographic footprint, verification status, and XML payloads.</p>
                            </div>
                        ) : (
                            <>
                                {/* Inspector Header */}
                                <div className="p-6 border-b border-white/10 bg-black/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-xl">{selected.request_type.toUpperCase()}</h3>
                                            <p className="text-[#86868b] font-mono text-xs mt-1">{selected.id}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-mono text-[#86868b]">{new Date(selected.created_at).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex px-6 border-b border-white/10 bg-black/40">
                                    <button
                                        onClick={() => setActiveTab('response')}
                                        className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'response' ? 'border-[#0071e3] text-[#0071e3]' : 'border-transparent text-[#86868b]'}`}
                                    >
                                        Transaction Data
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('xml')}
                                        className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'xml' ? 'border-[#0071e3] text-[#0071e3]' : 'border-transparent text-[#86868b]'}`}
                                    >
                                        XML Payload
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-auto p-6 font-mono text-xs">
                                    {activeTab === 'response' && (
                                        <pre className="bg-black/30 p-4 rounded-xl border border-white/5 overflow-auto text-blue-300 whitespace-pre-wrap break-all">
                                            {renderJson(selected.response_payload)}
                                        </pre>
                                    )}
                                    {activeTab === 'xml' && selected.response_payload?.xml && (
                                        <pre className="bg-black/30 p-4 rounded-xl border border-white/5 overflow-auto text-green-300 whitespace-pre-wrap break-all">
                                            {selected.response_payload.xml}
                                        </pre>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

