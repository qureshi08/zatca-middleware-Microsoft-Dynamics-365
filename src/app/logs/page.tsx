'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTransactionLogsAction } from '@/lib/zatca/actions';

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            // Passing a fallback empty string or fetching generic logs for the audit trail
            const data = await getTransactionLogsAction('BOJ-ORG-1001') || [];
            setLogs(data);
        } catch (e) {
            setLogs([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#050A18] text-white p-8 font-['Inter']">
            <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center">
                <div>
                    <Link href="/" className="text-red-500 hover:text-red-400 mb-4 inline-block transition-all">
                        &larr; BACK TO DASHBOARD
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        ZATCA API AUDIT TRAIL
                    </h1>
                </div>
                <button
                    onClick={fetchLogs}
                    className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-red-900/20"
                >
                    REFRESH
                </button>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Logs List */}
                <section className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            LIVE REQUEST STREAM
                        </h2>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Loading stream...</div>
                        ) : logs.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                No logs found. Trigger a compliance check to start streaming.
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedLog(log)}
                                    className={`p-6 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.02] ${selectedLog?.timestamp === log.timestamp ? 'bg-white/5 border-l-4 border-l-red-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.responseStatus === 200 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {log.responseStatus} {log.responseStatus === 200 ? 'PASS' : 'FAIL'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 uppercase font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-sm font-mono text-gray-300 truncate">
                                        {log.endpoint}
                                    </div>
                                    <div className="text-[10px] text-gray-600 font-mono mt-1">
                                        UUID: {log.uuid}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Log Detail */}
                <section className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">INSPECTOR</h2>
                        {selectedLog && (
                            <span className="text-xs text-gray-500">TRACING: {selectedLog.uuid}</span>
                        )}
                    </div>
                    <div className="flex-1 p-0 overflow-hidden flex flex-col">
                        {!selectedLog ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                <div className="text-4xl mb-4 opacity-20">🔍</div>
                                <h3 className="text-gray-400 mb-2">Select a transaction</h3>
                                <p className="text-xs text-gray-600">Select an entry from the stream to inspect the raw XML and ZATCA response.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 h-full">
                                <div>
                                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Request Body (JSON)</h4>
                                    <pre className="p-4 rounded-xl bg-black/40 text-[11px] font-mono whitespace-pre-wrap break-all text-gray-300 border border-white/5 max-h-[300px] overflow-y-auto">
                                        {JSON.stringify(selectedLog.request, null, 2)}
                                    </pre>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">ZATCA Response (RAW)</h4>
                                    <pre className="p-4 rounded-xl bg-black/40 text-[11px] font-mono whitespace-pre-wrap break-all text-green-500/90 border border-white/5 max-h-[300px] overflow-y-auto">
                                        {(() => {
                                            try {
                                                return JSON.stringify(JSON.parse(selectedLog.responseBody), null, 2);
                                            } catch (e) { return selectedLog.responseBody; }
                                        })()}
                                    </pre>
                                </div>

                                {selectedLog.request.invoice && (
                                    <div className="pt-4 border-t border-white/5">
                                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Decoded Invoice XML</h4>
                                        <div className="text-[9px] text-gray-500 mb-4 italic">Base64 content decoded for audit verification.</div>
                                        <pre className="p-4 rounded-xl bg-black/60 text-[11px] font-mono whitespace-pre text-gray-400 border border-white/5 overflow-x-auto max-h-[500px]">
                                            {Buffer.from(selectedLog.request.invoice, 'base64').toString('utf8')}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <footer className="max-w-7xl mx-auto mt-12 text-center text-gray-600 text-[10px] tracking-[0.2em] uppercase">
                Bank of Jordan | ZATCA Audit System v2.1.0-SIM
            </footer>

            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                }
                pre::-webkit-scrollbar {
                    width: 6px;
                }
                pre::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
}
