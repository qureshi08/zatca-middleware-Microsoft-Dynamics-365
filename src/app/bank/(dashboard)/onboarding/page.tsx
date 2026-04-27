'use client';

import { useEffect, useState } from 'react';
import { useBankAuthStore } from '@/store/bankAuthStore';
import { 
  FileCheck2, Server, ShieldCheck, Globe, CheckCircle2, 
  ArrowRight, Key, Zap, ListChecks 
} from 'lucide-react';

export default function BankOnboardingPage() {
  const { sessionToken, integrationConfigured, role } = useBankAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  const loadStatus = async () => {
    if (!sessionToken) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/bank/product/onboarding/status', {
        headers: { 'x-session-token': sessionToken },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data?.error || 'Failed to load onboarding status.');
        return;
      }
      if (!data?.connected) {
        setStep(1);
        setStatus('Middleware configuration invalid or unreachable. Please check your API key in Settings.');
        return;
      }
      if (data?.onboarding?.isLive) setStep(4);
      else if (data?.onboarding?.hasComplianceCSID) setStep(3);
      else setStep(2);
      setStatus(`Connected to middleware${data?.organization ? `: ${data.organization}` : ''}`);
    } catch (e: any) {
      setStatus(e?.message || 'Could not reach middleware.');
    } finally {
      setLoading(false);
    }
  };

  const generateCSR = async () => {
    if (!sessionToken) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/bank/product/onboarding/csr', {
        method: 'POST',
        headers: {
          'x-session-token': sessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data?.error || 'Failed to generate compliance CSID.');
        return;
      }
      setStatus('Compliance CSID generated successfully.');
      setStep(3);
    } catch (e: any) {
      setStatus(e?.message || 'CSR generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const activateProduction = async () => {
    if (!sessionToken) return;
    setLoading(true);
    setStatus(null);
    try {
      const verifyRes = await fetch('/api/bank/product/onboarding/verify', {
        method: 'POST',
        headers: {
          'x-session-token': sessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        setStatus(verifyData?.error || 'Compliance verification failed.');
        return;
      }

      const prodRes = await fetch('/api/bank/product/onboarding/production', {
        method: 'POST',
        headers: {
          'x-session-token': sessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const prodData = await prodRes.json().catch(() => ({}));
      if (!prodRes.ok) {
        setStatus(prodData?.error || 'Production activation failed.');
        return;
      }

      setStatus('Production CSID activated. Your bank is live.');
      setStep(4);
    } catch (e: any) {
      setStatus(e?.message || 'Production activation failed.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Environment Connection', desc: 'Link to Middleware API hub', icon: Server },
    { title: 'Identity & CSR', desc: 'Generate secure cryptograhic keys', icon: Key },
    { title: 'Compliance Test', desc: 'Verify ZATCA business rule alignment', icon: ShieldCheck },
    { title: 'Production Live', desc: 'Activate production certificates', icon: Zap }
  ];

  useEffect(() => {
    if (integrationConfigured && sessionToken) {
      void loadStatus();
    }
  }, [integrationConfigured, sessionToken]);

  return (
    <div className="animate-pro max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="h1">Bank Onboarding Wizard</h1>
        <p className="text-small">Complete these steps to authorize this portal for ZATCA-compliant transmissions.</p>
      </div>

      <div className="flex justify-between items-start mb-10">
        {steps.map((s, i) => {
          const num = i + 1;
          const active = step === num;
          const done = step > num;
          const Icon = s.icon;
          return (
            <div key={num} className="flex flex-col items-center gap-3 w-1/4 relative">
              {i < steps.length - 1 && (
                <div className={`absolute top-5 left-1/2 w-full h-[1px] ${done ? 'bg-blue-600' : 'bg-gray-100'}`} />
              )}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${
                done ? 'bg-blue-600 text-white' : active ? 'bg-white border-2 border-blue-600 shadow-xl shadow-blue-900/5 text-blue-600 scale-110' : 'bg-gray-50 border border-gray-100 text-gray-300'
              }`}>
                {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>
              <div className="text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-gray-400'}`}>{s.title}</p>
                <p className="hidden md:block text-[9px] text-gray-300 mt-0.5 leading-tight">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-pro p-10 text-center border-blue-100/50 bg-gradient-to-b from-blue-50/20 to-white">
        {!!status && (
          <div className="mb-6 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl p-3">
            {status}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 max-w-sm mx-auto">
             <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
                <Server size={32} />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Middleware Health Check</h2>
                <p className="text-small mt-2">Checking if the bank portal is correctly configured with the Middleware base URL and API keys.</p>
             </div>
             <div className={`p-4 rounded-xl border text-[11px] font-medium ${integrationConfigured ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                {integrationConfigured ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={14} />
                    Configuration valid. Ready to proceed.
                  </div>
                ) : 'Missing API Key in Settings.'}
             </div>
             <button
               className="btn-pro w-full h-10 flex items-center justify-center gap-2" 
               disabled={!integrationConfigured || loading}
               onClick={loadStatus}
             >
               {loading ? 'Checking...' : 'Initialize Onboarding'}
               <ArrowRight size={14} />
             </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 max-w-sm mx-auto animate-pro">
             <div className="w-16 h-16 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
                <Key size={32} />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Key Generation</h2>
                <p className="text-small mt-2">Provide FATOORA OTP and request compliance CSID from middleware.</p>
             </div>
             <div className="text-left">
               <label className="bank-form-label text-[10px] font-black uppercase">FATOORA OTP</label>
               <input
                 className="input-pro mt-1"
                 placeholder="Enter OTP from FATOORA portal"
                 value={otp}
                 onChange={(e) => setOtp(e.target.value)}
               />
             </div>
             <button className="btn-pro w-full h-10" onClick={generateCSR} disabled={role !== 'Admin' || loading || otp.length < 4}>
               {loading ? 'Generating...' : 'Submit CSR to ZATCA'}
             </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 max-w-sm mx-auto animate-pro">
             <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 mx-auto shadow-sm">
                <ListChecks size={32} />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Compliance Simulation</h2>
                <p className="text-small mt-2">Running a series of standard test invoices through the ZATCA Sandbox environment.</p>
             </div>
             <div className="space-y-2">
                {['Standard Invoice Test', 'Simplified Credit Note', 'Simplified Debit Note'].map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-white">
                    <span className="text-[11px] font-bold text-gray-700">{t}</span>
                    <span className="text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-1.5 py-0.5 rounded">Passed</span>
                  </div>
                ))}
             </div>
             <button className="btn-pro w-full h-10 mt-4" onClick={activateProduction} disabled={role !== 'Admin' || loading}>
               {loading ? 'Evaluating...' : 'Request Production ID'}
             </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 max-w-sm mx-auto animate-pro">
             <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mx-auto shadow-xl shadow-emerald-500/10">
                <Globe size={40} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Live in Production</h2>
                <p className="text-small mt-2 text-emerald-600 font-bold uppercase tracking-widest">Onboarding Success</p>
                <p className="text-[11px] text-gray-500 mt-1">This branch is now authorized to transmit production documents directly to FATOORA live servers.</p>
             </div>
             <div className="pt-4">
               <button className="btn-pro bg-emerald-600 hover:bg-emerald-700 w-full h-10" onClick={() => window.location.href = '/bank/dashboard'}>
                 Go to Dashboard
               </button>
             </div>
          </div>
        )}
      </div>

      <p className="text-center text-[9px] text-gray-300 font-black uppercase tracking-[0.2em] mt-10">
        Demo Flow · Powered by Z3C Nexus Engine
      </p>
    </div>
  );
}
