'use client';

import { useApp } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BusinessCentralSettingsPage() {
    const { activeBank, apiKey } = useApp();
    const router = useRouter();

    const [tenantId, setTenantId] = useState('');
    const [environment, setEnvironment] = useState('Production');
    const [companyId, setCompanyId] = useState('');
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [apiBaseUrl, setApiBaseUrl] = useState('');
    const [autoSubmit, setAutoSubmit] = useState(true);

    const [status, setStatus] = useState<'connected' | 'disconnected' | 'saving' | 'testing' | 'listing'>('disconnected');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [companies, setCompanies] = useState<Array<{ id: string; name: string }> | null>(null);

    useEffect(() => {
        if (!activeBank) {
            router.push('/login');
            return;
        }

        async function fetchConfig() {
            try {
                const res = await fetch('/api/bc/config', {
                    headers: { 'x-api-key': apiKey || '' }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.config) {
                        setTenantId(data.config.bc_tenant_id || '');
                        setEnvironment(data.config.bc_environment || 'Production');
                        setCompanyId(data.config.bc_company_id || '');
                        setClientId(data.config.bc_client_id || '');
                        setApiBaseUrl(data.config.bc_api_base_url || '');
                        setAutoSubmit(data.config.auto_submit ?? true);
                        setStatus(data.config.status || 'disconnected');
                    }
                }
            } catch (e) {
                console.error('Failed to load Business Central config', e);
            } finally {
                setLoading(false);
            }
        }

        fetchConfig();
    }, [activeBank, apiKey]);

    const post = async (action: 'test' | 'save' | 'companies') => {
        return fetch('/api/bc/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey || ''
            },
            body: JSON.stringify({
                tenantId,
                environment,
                companyId,
                clientId,
                clientSecret: clientSecret || undefined, // send secret only if typed
                apiBaseUrl: apiBaseUrl || undefined,
                autoSubmit,
                action
            })
        });
    };

    const handleAction = async (action: 'test' | 'save') => {
        setMessage(null);
        setCompanies(null);
        setStatus(action === 'test' ? 'testing' : 'saving');

        try {
            const res = await post(action);
            const data = await res.json();

            if (!res.ok || !data.success) {
                setMessage({ type: 'error', text: data.error || 'Request failed' });
                setStatus('disconnected');
            } else {
                setMessage({ type: 'success', text: data.message });
                if (action === 'test' || data.status === 'saved_connected') {
                    setStatus('connected');
                } else {
                    setStatus('disconnected');
                }
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Network error occurred' });
            setStatus('disconnected');
        }
    };

    const handleListCompanies = async () => {
        setMessage(null);
        setCompanies(null);
        setStatus('listing');
        try {
            const res = await post('companies');
            const data = await res.json();
            if (!res.ok || !data.success) {
                setMessage({ type: 'error', text: data.error || 'Could not list companies' });
            } else {
                setCompanies(data.companies || []);
                if (!data.companies?.length) {
                    setMessage({ type: 'info', text: 'No companies returned for this environment.' });
                }
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Network error occurred' });
        } finally {
            setStatus((s) => (s === 'listing' ? 'disconnected' : s));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const hostDomain = typeof window !== 'undefined' ? window.location.origin : 'https://your-middleware.com';

    return (
        <div className="animate-pro max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h1 className="h1 flex items-center gap-2">
                        <span className="text-2xl">⚙️</span> Dynamics 365 Business Central Sync
                    </h1>
                    <p className="text-small text-gray-400 mt-1">
                        Connect your Business Central environment using the REST API v2.0 and a Microsoft Entra ID app registration. Cleared signatures are written back to the source document in real time.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                        status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {status === 'connected' ? 'Connected' : status === 'testing' ? 'Testing...' : status === 'listing' ? 'Loading...' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Form Details */}
                <div className="md:col-span-2 space-y-4">
                    <div className="card-pro bg-white p-5 space-y-4 shadow-sm border-gray-100">
                        <h3 className="h3 text-gray-800">Connection Parameters</h3>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Entra Tenant ID</label>
                                    <input
                                        type="text"
                                        className="input-pro"
                                        placeholder="contoso.onmicrosoft.com or GUID"
                                        value={tenantId}
                                        onChange={(e) => setTenantId(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Environment</label>
                                    <input
                                        type="text"
                                        className="input-pro"
                                        placeholder="Production"
                                        value={environment}
                                        onChange={(e) => setEnvironment(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Application (Client) ID</label>
                                <input
                                    type="text"
                                    className="input-pro"
                                    placeholder="Azure App Registration client ID (GUID)"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Client Secret</label>
                                <input
                                    type="password"
                                    className="input-pro"
                                    placeholder={clientId ? '•••••••••••••••• (Leave blank to keep current)' : 'Azure App Registration client secret value'}
                                    value={clientSecret}
                                    onChange={(e) => setClientSecret(e.target.value)}
                                />
                                <span className="text-[9px] text-gray-400 mt-1 block">Create under Microsoft Entra ID &gt; App registrations &gt; Certificates &amp; secrets. Store the <b>Value</b>, not the Secret ID.</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Company ID</label>
                                    <input
                                        type="text"
                                        className="input-pro"
                                        placeholder="BC Company GUID"
                                        value={companyId}
                                        onChange={(e) => setCompanyId(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">API Base URL (optional)</label>
                                    <input
                                        type="url"
                                        className="input-pro"
                                        placeholder="https://api.businesscentral.dynamics.com"
                                        value={apiBaseUrl}
                                        onChange={(e) => setApiBaseUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="autoSubmit"
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    checked={autoSubmit}
                                    onChange={(e) => setAutoSubmit(e.target.checked)}
                                />
                                <label htmlFor="autoSubmit" className="text-xs font-semibold text-gray-700">
                                    Enable automated writeback on clearance
                                </label>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg text-xs font-bold ${
                                message.type === 'success' ? 'bg-green-50 text-green-800' :
                                message.type === 'info' ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'
                            }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Company discovery results */}
                        {companies && companies.length > 0 && (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                                <p className="font-bold text-gray-700">Companies in this environment (click to use):</p>
                                {companies.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setCompanyId(c.id)}
                                        className="block text-left text-orange-700 hover:underline font-mono text-[11px]"
                                    >
                                        {c.name} — {c.id}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-gray-50">
                            <button
                                type="button"
                                className="btn-pro bg-orange-600 hover:bg-orange-700"
                                onClick={() => handleAction('save')}
                                disabled={status === 'saving' || status === 'testing' || status === 'listing'}
                            >
                                {status === 'saving' ? 'Saving...' : 'Save Settings'}
                            </button>
                            <button
                                type="button"
                                className="btn-pro btn-pro-secondary"
                                onClick={() => handleAction('test')}
                                disabled={status === 'saving' || status === 'testing' || status === 'listing'}
                            >
                                {status === 'testing' ? 'Verifying...' : 'Test Connection'}
                            </button>
                            <button
                                type="button"
                                className="btn-pro btn-pro-secondary text-orange-700 border-orange-100 hover:bg-orange-50"
                                onClick={handleListCompanies}
                                disabled={status === 'saving' || status === 'testing' || status === 'listing'}
                            >
                                {status === 'listing' ? 'Loading...' : 'List Companies'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Deployment Status side column */}
                <div className="space-y-4">
                    <div className="card-pro bg-gray-50 p-4 border-dashed border-gray-200">
                        <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2">Sync Infrastructure</h4>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Connection:</span>
                                <span className={status === 'connected' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                    {status === 'connected' ? 'Active' : 'Offline'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Auth:</span>
                                <span className="font-semibold text-gray-800">OAuth 2.0 (Entra ID)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">API:</span>
                                <span className="font-semibold text-orange-600">REST API v2.0</span>
                            </div>
                            <hr className="border-gray-200 my-2" />
                            <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                Grant the app registration the <b>API.ReadWrite.All</b> (Business Central) application permission and authorize it inside BC under <b>Microsoft Entra Applications</b>.
                            </p>
                        </div>
                    </div>

                    <div className="card-pro bg-black text-white p-4">
                        <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-1">Webhook URL</label>
                        <code className="text-[10px] font-mono select-all break-all block p-2 bg-gray-900 rounded border border-gray-800 text-orange-300">
                            {hostDomain}/api/bc/webhook
                        </code>
                        <span className="text-[9px] text-gray-400 mt-2 block leading-snug">
                            Point a Power Automate flow (or BC webhook subscription) at this URL on &quot;Sales Invoice Posted&quot;.
                        </span>
                    </div>
                </div>
            </div>

            {/* Setup Instructions */}
            <div className="card-pro bg-white p-5 space-y-4 shadow-sm border-gray-100">
                <h3 className="h3 text-gray-800 flex items-center gap-2">
                    <span className="text-lg">⚡</span> Setup Playbook: Automating Business Central
                </h3>
                <p className="text-xs text-gray-500">
                    Business Central authenticates service-to-service calls with Microsoft Entra ID (OAuth 2.0). Register an app, grant it API access, then trigger this middleware whenever a sales invoice is posted.
                </p>

                <div className="space-y-3">
                    <div className="text-xs space-y-1">
                        <p className="font-bold text-gray-700">Step 1: Register an Entra ID application</p>
                        <ul className="list-disc pl-5 text-[11px] text-gray-500 space-y-0.5 mt-1">
                            <li>Azure Portal &gt; <b>Microsoft Entra ID</b> &gt; <b>App registrations</b> &gt; <b>New registration</b>.</li>
                            <li>Copy the <b>Application (client) ID</b> and <b>Directory (tenant) ID</b>.</li>
                            <li>Under <b>Certificates &amp; secrets</b>, create a new client secret and copy its <b>Value</b>.</li>
                            <li>Under <b>API permissions</b>, add <b>Dynamics 365 Business Central &gt; Application permissions &gt; API.ReadWrite.All</b>, then grant admin consent.</li>
                        </ul>
                    </div>

                    <div className="text-xs space-y-1">
                        <p className="font-bold text-gray-700">Step 2: Authorize the app inside Business Central</p>
                        <ul className="list-disc pl-5 text-[11px] text-gray-500 space-y-0.5 mt-1">
                            <li>In BC, search <b>Microsoft Entra Applications</b> and add a new entry with your Client ID.</li>
                            <li>Set State = <b>Enabled</b> and assign the <b>D365 AUTOMATION</b> (or appropriate) permission set.</li>
                            <li>Use <b>List Companies</b> above to fetch your Company GUID, then paste it into the Company ID field and save.</li>
                        </ul>
                    </div>

                    <div className="text-xs space-y-1">
                        <p className="font-bold text-gray-700">Step 3: Trigger on posting (Power Automate)</p>
                        <p className="text-gray-500">Create a Power Automate cloud flow:</p>
                        <ul className="list-disc pl-5 text-[11px] text-gray-500 space-y-0.5 mt-1">
                            <li><b>Trigger:</b> Business Central &mdash; <i>When a record is created</i> on <code>Sales Invoices</code> (posted).</li>
                            <li><b>Action:</b> <i>HTTP &mdash; POST</i> to the Webhook URL with header <code>x-api-key</code>.</li>
                            <li><b>Body:</b> send the document <code>systemId</code> as shown below.</li>
                        </ul>
                    </div>

                    <div>
                        <p className="font-bold text-gray-700 text-xs mb-1">Step 4: HTTP request body</p>
                        <pre className="p-3 bg-gray-950 text-green-400 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed border border-gray-900 max-h-72">
{`POST ${hostDomain}/api/bc/webhook
Headers:
  Content-Type: application/json
  x-api-key: ${apiKey || 'YOUR_API_KEY_HERE'}

Body (pull mode — middleware fetches & writes back):
{
  "action": "pull",
  "documentId": "@{triggerOutputs()?['body/systemId']}",
  "documentKind": "invoice"
}

For credit memos, set "documentKind": "creditMemo".`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
