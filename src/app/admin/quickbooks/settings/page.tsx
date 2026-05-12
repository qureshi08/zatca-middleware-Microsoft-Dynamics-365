'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Settings, Link, CheckCircle2, XCircle, RefreshCw, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';

function QuickbooksSettingsContent() {
  const {
    qbClientId, setQbClientId,
    qbClientSecret, setQbClientSecret,
    qbRealmId, setQbRealmId,
    qbAccessToken, setQbAccessToken,
    qbRefreshToken, setQbRefreshToken,
    qbTokenExpiresAt, setQbTokenExpiresAt,
    qbConnected, setQbConnected
  } = useApp();

  const searchParams = useSearchParams();
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // Handle OAuth redirect code
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !qbConnected) {
      exchangeCodeForTokens(code);
    }
  }, [searchParams]);

  const exchangeCodeForTokens = async (code: string) => {
    setTesting(true);
    try {
      const redirectUri = `${window.location.origin}/api/quickbooks/oauth/callback`;
      const authHeader = btoa(`${qbClientId}:${qbClientSecret}`);
      
      const resp = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error_description || 'Token exchange failed');
      }

      const data = await resp.json();
      setQbAccessToken(data.access_token);
      setQbRefreshToken(data.refresh_token);
      setQbTokenExpiresAt(Date.now() + data.expires_in * 1000);
      setQbConnected(true);
      setMsg({ type: 'success', text: 'QuickBooks connected successfully!' });
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setTesting(false);
    }
  };

  const startOAuth = () => {
    if (!qbClientId || !qbClientSecret) {
      setMsg({ type: 'error', text: 'Please enter Client ID and Secret first.' });
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/quickbooks/oauth/callback`);
    const url = `https://appcenter.intuit.com/connect/oauth2?client_id=${qbClientId}&redirect_uri=${redirectUri}&response_type=code&scope=com.intuit.quickbooks.accounting&state=quickbooks_oauth`;
    window.location.href = url;
  };

  const testConnection = async () => {
    setTesting(true);
    setMsg(null);
    try {
      const resp = await fetch('/api/quickbooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: qbAccessToken, realmId: qbRealmId }),
      });
      const data = await resp.json();
      if (data.ok) {
        setMsg({ type: 'success', text: 'Connection is active and working!' });
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setTesting(false);
    }
  };

  const disconnect = () => {
    setQbAccessToken('');
    setQbRefreshToken('');
    setQbTokenExpiresAt(0);
    setQbConnected(false);
    setMsg({ type: 'success', text: 'Disconnected from QuickBooks.' });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Settings className="text-blue-600" size={32} />
            QuickBooks Integration
          </h1>
          <p className="text-slate-500 mt-2">Configure your QuickBooks Online connection for automated ZATCA compliance.</p>
        </div>
        {qbConnected ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200 font-medium">
            <CheckCircle2 size={18} />
            Connected
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full border border-slate-200 font-medium">
            <XCircle size={18} />
            Disconnected
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Credentials Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 border-b pb-4">
            <Link size={20} className="text-blue-500" />
            API Credentials
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter Intuit Client ID"
                value={qbClientId}
                onChange={(e) => setQbClientId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client Secret</label>
              <input
                type="password"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter Intuit Client Secret"
                value={qbClientSecret}
                onChange={(e) => setQbClientSecret(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Realm ID</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter QuickBooks Realm ID"
                value={qbRealmId}
                onChange={(e) => setQbRealmId(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            {!qbConnected ? (
              <button
                onClick={startOAuth}
                disabled={testing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {testing ? <RefreshCw className="animate-spin" /> : <Link size={18} />}
                Connect to QuickBooks
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="w-full py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <LogOut size={18} />
                Disconnect Integration
              </button>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 border-b pb-4">
            <CheckCircle2 size={20} className="text-green-500" />
            Integration Status
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">OAuth Status</span>
              <span className={qbConnected ? "text-green-600 font-medium" : "text-slate-400"}>
                {qbConnected ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Token Expiry</span>
              <span className="text-slate-700 font-mono text-sm">
                {qbTokenExpiresAt > 0 ? new Date(qbTokenExpiresAt).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Webhook Sync</span>
              <span className="text-blue-600 font-medium">Automatic</span>
            </div>
          </div>

          {qbConnected && (
            <button
              onClick={testConnection}
              disabled={testing}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {testing ? <RefreshCw className="animate-spin" /> : <RefreshCw size={18} />}
              Test API Connection
            </button>
          )}

          {msg && (
            <div className={`p-4 rounded-xl border ${
              msg.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
            } flex items-start gap-3 animate-in slide-in-from-top-2 duration-300`}>
              {msg.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <XCircle size={20} className="shrink-0" />}
              <p className="text-sm">{msg.text}</p>
            </div>
          )}
        </div>
      </div>

      {/* Guide Section */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h3 className="text-blue-800 font-semibold mb-2">Setup Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
          <li>Create an application in the <a href="https://developer.intuit.com" target="_blank" className="underline font-medium">Intuit Developer Portal</a>.</li>
          <li>Set your Redirect URI to: <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">{typeof window !== 'undefined' ? `${window.location.origin}/api/quickbooks/oauth/callback` : '.../api/quickbooks/oauth/callback'}</code></li>
          <li>Copy the Client ID and Secret into the fields above.</li>
          <li>Configure your Webhook URL to point to <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">{typeof window !== 'undefined' ? `${window.location.origin}/api/quickbooks/webhook` : '.../api/quickbooks/webhook'}</code> for real-time sync.</li>
        </ul>
      </div>
    </div>
  );
}

export default function QuickbooksSettings() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading settings...</div>}>
      <QuickbooksSettingsContent />
    </Suspense>
  );
}
