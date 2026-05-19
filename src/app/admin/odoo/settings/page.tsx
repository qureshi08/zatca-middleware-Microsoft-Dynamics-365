'use client';

import { useApp } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OdooSettingsPage() {
    const { activeBank, apiKey } = useApp();
    const router = useRouter();

    const [odooUrl, setOdooUrl] = useState('');
    const [odooDb, setOdooDb] = useState('');
    const [odooUsername, setOdooUsername] = useState('');
    const [odooPassword, setOdooPassword] = useState('');
    const [autoSubmit, setAutoSubmit] = useState(true);

    const [status, setStatus] = useState<'connected' | 'disconnected' | 'saving' | 'testing' | 'provisioning'>('disconnected');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [provisionResults, setProvisionResults] = useState<{ created: string[]; errors: string[] } | null>(null);

    useEffect(() => {
        if (!activeBank) {
            router.push('/login');
            return;
        }

        async function fetchConfig() {
            try {
                const res = await fetch('/api/odoo/config', {
                    headers: { 'x-api-key': apiKey || '' }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.config) {
                        setOdooUrl(data.config.odoo_url || '');
                        setOdooDb(data.config.odoo_db || '');
                        setOdooUsername(data.config.odoo_username || '');
                        setAutoSubmit(data.config.auto_submit ?? true);
                        setStatus(data.config.status || 'disconnected');
                    }
                }
            } catch (e) {
                console.error("Failed to load Odoo config", e);
            } finally {
                setLoading(false);
            }
        }

        fetchConfig();
    }, [activeBank, apiKey]);

    const handleAction = async (action: 'test' | 'save' | 'provision') => {
        setMessage(null);
        setProvisionResults(null);

        if (action === 'test') setStatus('testing');
        else if (action === 'provision') setStatus('provisioning');
        else setStatus('saving');

        try {
            const res = await fetch('/api/odoo/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey || ''
                },
                body: JSON.stringify({
                    odooUrl,
                    odooDb,
                    odooUsername,
                    odooPassword: odooPassword || undefined, // Send password only if typed
                    autoSubmit,
                    action
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setMessage({ type: 'error', text: data.error || 'Request failed' });
                if (action === 'provision' && data.errors) {
                    setProvisionResults({ created: data.created || [], errors: data.errors });
                }
                setStatus('disconnected');
            } else {
                setMessage({ type: 'success', text: data.message });
                if (action === 'provision') {
                    setProvisionResults({ created: data.created || [], errors: [] });
                }
                
                // Update connection status based on actions
                if (action === 'test' || action === 'provision' || data.status === 'saved_connected') {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Determine current middleware domain (for the python action code snippet)
    const hostDomain = typeof window !== 'undefined' ? window.location.origin : 'https://your-middleware.com';

    return (
        <div className="animate-pro max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h1 className="h1 flex items-center gap-2">
                        <span className="text-2xl">⚙️</span> Odoo ERP Sync Configuration
                    </h1>
                    <p className="text-small text-gray-400 mt-1">
                        Connect your Saudi Odoo instance using JSON-RPC. Cleared signatures are pushed back to invoice custom fields in real time.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                        status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {status === 'connected' ? 'Connected' : status === 'testing' ? 'Testing...' : status === 'provisioning' ? 'Provisioning...' : 'Disconnected'}
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
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Odoo Host URL</label>
                                <input
                                    type="url"
                                    className="input-pro"
                                    placeholder="https://your-company.odoo.com"
                                    value={odooUrl}
                                    onChange={(e) => setOdooUrl(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Database Name</label>
                                    <input
                                        type="text"
                                        className="input-pro"
                                        placeholder="odoo-db-name"
                                        value={odooDb}
                                        onChange={(e) => setOdooDb(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Username / Email</label>
                                    <input
                                        type="text"
                                        className="input-pro"
                                        placeholder="admin@yourcompany.com"
                                        value={odooUsername}
                                        onChange={(e) => setOdooUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Password or API Key</label>
                                <input
                                    type="password"
                                    className="input-pro"
                                    placeholder={odooUrl ? '•••••••••••••••• (Leave blank to keep current)' : 'User Password / Odoo Developer Key'}
                                    value={odooPassword}
                                    onChange={(e) => setOdooPassword(e.target.value)}
                                />
                                <span className="text-[9px] text-gray-400 mt-1 block">For security, we recommend generating a dedicated Odoo API Key under Settings &gt; Users.</span>
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
                                    Enable Automated Webhook Writeback on Clearance
                                </label>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg text-xs font-bold ${
                                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                            }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Custom Fields Provision Details */}
                        {provisionResults && (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                                <p className="font-bold text-gray-700">Database Schema Changes:</p>
                                {provisionResults.created.length > 0 && (
                                    <p className="text-green-700">✓ Created: {provisionResults.created.join(', ')}</p>
                                )}
                                {provisionResults.errors.length > 0 && (
                                    <p className="text-red-700">❌ Failed: {provisionResults.errors.join(', ')}</p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-gray-50">
                            <button
                                type="button"
                                className="btn-pro bg-orange-600 hover:bg-orange-700"
                                onClick={() => handleAction('save')}
                                disabled={status === 'saving' || status === 'testing' || status === 'provisioning'}
                            >
                                {status === 'saving' ? 'Saving...' : 'Save Settings'}
                            </button>
                            <button
                                type="button"
                                className="btn-pro btn-pro-secondary"
                                onClick={() => handleAction('test')}
                                disabled={status === 'saving' || status === 'testing' || status === 'provisioning'}
                            >
                                {status === 'testing' ? 'Verifying...' : 'Test Connection'}
                            </button>
                            <button
                                type="button"
                                className="btn-pro btn-pro-secondary text-orange-700 border-orange-100 hover:bg-orange-50"
                                onClick={() => handleAction('provision')}
                                disabled={status === 'saving' || status === 'testing' || status === 'provisioning'}
                            >
                                {status === 'provisioning' ? 'Deploying...' : 'Auto-Provision Fields'}
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
                                <span className="text-gray-500">Field Deploy:</span>
                                <span className="font-semibold text-gray-800">account.move (Customized)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Webhook Status:</span>
                                <span className="font-semibold text-orange-600">Active Listener</span>
                            </div>
                            <hr className="border-gray-200 my-2" />
                            <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                Once Odoo Connection parameters are verified, click <b>Auto-Provision Fields</b> to inject custom ZATCA fields into your Odoo database dynamically.
                            </p>
                        </div>
                    </div>

                    <div className="card-pro bg-black text-white p-4">
                        <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-1">Webhook URL</label>
                        <code className="text-[10px] font-mono select-all break-all block p-2 bg-gray-900 rounded border border-gray-800 text-orange-300">
                            {hostDomain}/api/odoo/webhook
                        </code>
                        <span className="text-[9px] text-gray-400 mt-2 block leading-snug">
                            Configure Odoo's automated action/server action to trigger on "Invoice Posted" pointing to this webhook.
                        </span>
                    </div>
                </div>
            </div>

            {/* Odoo Server Action Instructions */}
            <div className="card-pro bg-white p-5 space-y-4 shadow-sm border-gray-100">
                <h3 className="h3 text-gray-800 flex items-center gap-2">
                    <span className="text-lg">⚡</span> Setup Playbook: Automating Odoo (No-Install Webhook Trigger)
                </h3>
                <p className="text-xs text-gray-500">
                    Odoo has a powerful <b>Server Actions</b> engine. You don't need to install any Odoo App or restart your Odoo container. Just create a Server Action with this Python script to clear invoices with ZATCA automatically when validated:
                </p>

                <div className="space-y-3">
                    <div className="text-xs space-y-1">
                        <p className="font-bold text-gray-700">Step 1: Create Odoo Fields</p>
                        <p className="text-gray-500">Click the <b>Auto-Provision Fields</b> button above to create fields automatically, or create them manually in Settings &gt; Technical &gt; Fields on the model <code>account.move</code>:</p>
                        <ul className="list-disc pl-5 text-[11px] text-gray-500 space-y-0.5 mt-1">
                            <li><code>x_zatca_uuid</code> (Type: Char / Input Text)</li>
                            <li><code>x_zatca_status</code> (Type: Selection - Values: pending, submitted, cleared, failed)</li>
                            <li><code>x_zatca_qr_code</code> (Type: Text)</li>
                            <li><code>x_zatca_xml</code> (Type: Text)</li>
                            <li><code>x_zatca_error</code> (Type: Text)</li>
                        </ul>
                    </div>

                    <div className="text-xs space-y-1">
                        <p className="font-bold text-gray-700">Step 2: Create Server Action</p>
                        <p className="text-gray-500">Go to Odoo <b>Settings &gt; Technical &gt; Actions &gt; Server Actions</b> and create a new record:</p>
                        <ul className="list-disc pl-5 text-[11px] text-gray-500 space-y-0.5 mt-1">
                            <li><b>Action Name:</b> <code>ZATCA E-Invoicing Auto-Clearance</code></li>
                            <li><b>Model:</b> <code>Journal Entry</code> (or <code>account.move</code>)</li>
                            <li><b>Action To Do:</b> <code>Execute Python Code</code></li>
                        </ul>
                    </div>

                    <div>
                        <p className="font-bold text-gray-700 text-xs mb-1">Step 3: Paste Python Code</p>
                        <pre className="p-3 bg-gray-950 text-green-400 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed border border-gray-900 max-h-72">
{`# Trigger ZATCA Clearance on Validate/Post
if record.move_type in ['out_invoice', 'out_refund'] and record.state == 'posted' and record.x_zatca_status != 'cleared':
    import requests
    import json

    # Configure Middleware Webhook
    webhook_url = "${hostDomain}/api/odoo/webhook"
    api_key = "${apiKey || 'YOUR_API_KEY_HERE'}"

    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }
    
    # Pull invoice data via middleware JSON-RPC bridge
    payload = {
        "action": "pull",
        "odooInvoiceId": record.id
    }

    try:
        response = requests.post(webhook_url, headers=headers, json=payload, timeout=15)
        res_data = response.json()
        
        if response.status_code != 200 or not res_data.get('success'):
            error_msg = res_data.get('error', 'Unknown response error')
            record.write({
                'x_zatca_status': 'failed',
                'x_zatca_error': error_msg
            })
            record.message_post(body="❌ <b>ZATCA Submission Failed:</b> " + str(error_msg))
    except Exception as e:
        record.write({
            'x_zatca_status': 'failed',
            'x_zatca_error': 'Connection timeout: ' + str(e)
        })
        record.message_post(body="❌ <b>ZATCA Middleware Timeout:</b> Could not reach Z3C node.")
`}
                        </pre>
                    </div>

                    <div className="text-xs space-y-1">
                        <p className="font-bold text-gray-700">Step 4: Setup automated trigger</p>
                        <p className="text-gray-500">Create an <b>Automated Action</b> (Settings &gt; Technical &gt; Automation &gt; Automated Actions):</p>
                        <ul className="list-disc pl-5 text-[11px] text-gray-500 space-y-0.5 mt-1">
                            <li><b>Model:</b> <code>Journal Entry</code> (<code>account.move</code>)</li>
                            <li><b>Trigger:</b> <code>On Update</code></li>
                            <li><b>Apply on:</b> <code>[("state", "=", "posted")]</code></li>
                            <li><b>Action:</b> Choose the <code>ZATCA E-Invoicing Auto-Clearance</code> Server Action created in Step 2.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
