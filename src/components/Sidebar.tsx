'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useBankAuthStore } from '@/store/bankAuthStore';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const Icon = {
    grid: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
    ),
    shield: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    ),
    key: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5" /></svg>
    ),
    list: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
    ),
    chevronDown: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
    ),
    chevronRight: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
    ),
    bank: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" /></svg>
    ),
    dashboard: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
    ),
    receipt: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /></svg>
    ),
    users: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
    settings: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
    ),
    building: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" /></svg>
    ),
    log: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
    ),
    fileCheck: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="m9 15 2 2 4-4" /></svg>
    ),
    stamp: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 21h14M7 8V5a3 3 0 0 1 6 0v3" /><rect width="18" height="6" x="3" y="14" rx="1" /><path d="M12 8a4 4 0 0 1 4 4h-8a4 4 0 0 1 4-4z" /></svg>
    ),
    eye: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
    ),
    logout: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
    ),
};

export default function Sidebar({ mode: _unused }: { mode: string }) {
    const pathname = usePathname();
    const { activeBank, setActiveBank, apiKey, setApiKey } = useApp();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Sync User Session (Supabase fallback)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
            } else if (activeBank) {
                // INTERNAL SESSION DETECTED (via Context)
                setUser({
                    email: 'institutional-admin',
                    user_metadata: { organization_id: activeBank.id }
                } as any);

                // Auto-provision key if missing
                if (!apiKey) {
                    const stableKeySnippet = activeBank.id.replace(/-/g, '').slice(0, 32);
                    setApiKey(`sk_zatca_live_${stableKeySnippet}`);
                }
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) setUser(session.user);
            else if (!activeBank) setUser(null);
        });

        return () => subscription.unsubscribe();
    }, [activeBank, setActiveBank, apiKey, setApiKey]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href.split('?')[0]);
    };
    };

    if (loading) return <aside className="sidebar p-8 text-xs font-bold text-gray-300">HUB_SYNC...</aside>;

    return (
        <aside className="sidebar shadow-2xl">
            <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-[13px] text-white font-black shadow-lg shadow-blue-500/20">Z</div>
                    <span className="text-[16px] font-extrabold tracking-tight text-black">Z3C<span className="text-gray-400">.</span>HUB</span>
                </div>
                {user && (
                    <button onClick={handleLogout} className="text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase">Logout</button>
                )}
            </div>

            {user ? (
                <>
                    <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Institutional Node</label>
                        <p className="text-[13px] font-bold text-gray-900 truncate">{activeBank?.name || 'Loading Node...'}</p>
                    </div>

                    <nav className="flex-1 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                        <div>
                            <div className="nav-label">Protocol Nexus</div>
                            <Link href="/" className={`nav-item${isActive('/') ? ' active' : ''}`}>{Icon.grid} Dashboard</Link>
                            <Link href="/explorer" className={`nav-item${isActive('/explorer') ? ' active' : ''}`}>{Icon.grid} API Explorer</Link>
                        </div>

                        <div>
                            <div className="nav-label">ZATCA Tunnel</div>
                            <Link href="/onboarding" className={`nav-item${isActive('/onboarding') ? ' active' : ''}`}>{Icon.key} Handshake</Link>
                            <Link href="/compliance" className={`nav-item${isActive('/compliance') ? ' active' : ''}`}>{Icon.shield} Validation</Link>
                        </div>

                        <div>
                            <div className="nav-label">Audit Logs</div>
                            <Link href="/invoices" className={`nav-item${isActive('/invoices') ? ' active' : ''}`}>{Icon.list} Transaction Feed</Link>
                        </div>
                    </nav>
                </>
            ) : (
                <div className="flex-1 flex flex-col justify-center gap-6">
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                        <h3 className="text-sm font-bold text-blue-800 mb-2">Institutional Access</h3>
                        <p className="text-[11px] text-blue-600 mb-6 leading-relaxed">Sign in with your bank credentials to manage your node registry.</p>
                        <Link href="/login" className="block w-full h-10 bg-blue-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center hover:bg-black transition-all">Sign In</Link>
                    </div>

                    <div className="text-center p-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">New Bank Account?</p>
                        <Link href="/register" className="text-[11px] text-blue-600 font-bold hover:underline">Register your Institution →</Link>
                    </div>
                </div>
            )}

            <div className="mt-auto pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">System Status: {user ? 'Encrypted' : 'Standby'}</span>
                </div>
                <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">Version 2.5.4 · Institutional Hub</p>
            </div>
        </aside>
    );
}
