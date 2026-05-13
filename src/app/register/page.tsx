'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * INSTITUTIONAL REGISTRATION (v14.2 - DEBUG MODE)
 * Verbose error reporting for system troubleshooting.
 */

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bankName: '',
        taxNumber: '',
        vatNumber: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [details, setDetails] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setDetails(null);

        try {
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Registration failed');
                setDetails(data.details || 'No additional details provided.');
                return;
            }

            router.push('/login?registered=true');
        } catch (err: any) {
            setError('Network Protocol Error');
            setDetails(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-xl relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Join the Banking Cloud</h1>
                    <p className="text-gray-400 text-sm">Provision your institutional node and activate ZATCA connectivity in minutes.</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="space-y-2">
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black p-4 rounded-xl text-center uppercase tracking-widest">
                                    {error}
                                </div>
                                {details && (
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[10px] text-gray-400 break-all">
                                        DEBUG_DETAILS: {details}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Institution Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Bank of Saudia"
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                                    value={formData.bankName}
                                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Tax ID (TIN)</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="1010010000"
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                                    value={formData.taxNumber}
                                    onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">VAT Number</label>
                            <input
                                required
                                type="text"
                                placeholder="399999999900003"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                                value={formData.vatNumber}
                                onChange={e => setFormData({ ...formData, vatNumber: e.target.value })}
                            />
                        </div>

                        <div className="h-px bg-white/10 my-4" />

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Admin Email</label>
                            <input
                                required
                                type="email"
                                placeholder="admin@bank.jo"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Password</label>
                            <input
                                required
                                type="password"
                                placeholder="••••••••"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'Initializing Context...' : 'Complete Registration →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
