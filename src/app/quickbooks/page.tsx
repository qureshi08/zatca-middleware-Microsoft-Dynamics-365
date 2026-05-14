'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Public landing page for the QuickBooks ↔ ZATCA integration.
 *
 * This is intentionally separate from the bank-side institutional flow:
 * a Saudi business using QuickBooks Online does NOT need to be a registered
 * bank in the middleware to come here. They land, read what the integration
 * does, and then either sign in to manage an existing connection or
 * register their business to start a new one.
 *
 * If the visitor is already signed in (activeBank present), we transparently
 * forward them to the actual settings page so they don't have to click again.
 */
export default function QuickbooksLandingPage() {
    const { activeBank, isLoading } = useApp();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && activeBank) {
            router.replace('/admin/quickbooks/settings');
        }
    }, [isLoading, activeBank, router]);

    if (!mounted || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-pro">
            <section className="section-pro border-b border-gray-100 bg-gradient-to-b from-emerald-50/40 to-transparent">
                <div className="container max-w-3xl mx-auto text-center py-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        QuickBooks Integration
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
                        Connect QuickBooks Online to ZATCA
                    </h1>

                    <p className="text-[14px] text-gray-500 leading-relaxed max-w-xl mx-auto mb-10">
                        Every invoice you create in QuickBooks is automatically signed and submitted
                        to ZATCA's clearance or reporting platform. No spreadsheets, no manual portal
                        uploads, no missed deadlines.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                        <Link
                            href="/login?next=/admin/quickbooks/settings"
                            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[13px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 flex-1"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                            </svg>
                            Sign In to Configure
                        </Link>
                        <Link
                            href="/register?intent=quickbooks"
                            className="h-12 px-6 border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-800 font-bold rounded-xl text-[13px] transition-all flex items-center justify-center gap-2 flex-1"
                        >
                            Register Your Business
                        </Link>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-6">
                        Don't need a bank account on the middleware — QuickBooks integration is its own flow.
                    </p>
                </div>
            </section>

            <section className="section-pro">
                <div className="container max-w-4xl mx-auto py-12">
                    <h2 className="h3 text-center mb-10">How it works</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                step: '1',
                                title: 'Register Your Business',
                                body: 'Create a tenant for your business on the middleware. Takes about a minute — name, VAT number, contact email.',
                            },
                            {
                                step: '2',
                                title: 'Connect QuickBooks',
                                body: 'Paste your Intuit Client ID + Secret and authorize the middleware to read invoices from your QuickBooks Online account.',
                            },
                            {
                                step: '3',
                                title: 'Done — Invoices Auto-Sync',
                                body: 'Every new QB invoice is fetched, mapped to ZATCA UBL 2.1, signed with your CSID, and cleared or reported. QR code is pushed back to QB.',
                            },
                        ].map((s) => (
                            <div key={s.step} className="card-pro p-6 bg-white border border-gray-100">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[15px] mb-4">
                                    {s.step}
                                </div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 mb-2">{s.title}</h3>
                                <p className="text-[12px] text-gray-500 leading-relaxed">{s.body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-6 bg-gray-900 rounded-2xl text-white max-w-2xl mx-auto">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                                ⚙
                            </div>
                            <div>
                                <h4 className="text-[13px] font-extrabold mb-1">Already connected?</h4>
                                <p className="text-[12px] text-gray-400 leading-relaxed mb-3">
                                    If your business is already registered and you just need to update your QuickBooks
                                    credentials or check sync status, sign in and head to settings.
                                </p>
                                <Link
                                    href="/login?next=/admin/quickbooks/settings"
                                    className="text-[12px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                                >
                                    Go to QuickBooks settings →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
