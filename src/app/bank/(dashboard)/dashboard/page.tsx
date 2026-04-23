'use client';

import { useEffect, useState } from 'react';
import { useBankAuthStore } from '@/store/bankAuthStore';
import Link from 'next/link';
import { Receipt, FileCheck2, Users, AlertTriangle } from 'lucide-react';

export default function BankDashboardPage() {
  const { sessionToken } = useBankAuthStore();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!sessionToken) return;
    fetch('/api/bank/product/dashboard/summary', {
      headers: { 'x-session-token': sessionToken },
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => undefined);
  }, [sessionToken]);

  const stats = [
    { name: 'Pending Review', value: data?.invoiceSummary?.pendingReview || 0, icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-50' },
    { name: 'Cleared / Reported', value: (data?.invoiceSummary?.cleared || 0) + (data?.invoiceSummary?.reported || 0), icon: FileCheck2, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Rejected / Failed', value: data?.invoiceSummary?.rejected || 0, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { name: 'Customers', value: data?.customers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  const statusColorMap: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted_for_check: 'bg-blue-100 text-blue-700',
    checked: 'bg-indigo-100 text-indigo-700',
    approved_for_submission: 'bg-purple-100 text-purple-700',
    submitted_to_middleware: 'bg-cyan-100 text-cyan-700',
    cleared: 'bg-green-100 text-green-700',
    reported: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    failed_submission: 'bg-red-100 text-red-600',
    returned_by_checker: 'bg-amber-100 text-amber-700',
    returned_by_approver: 'bg-orange-100 text-orange-700',
  };

  const statusLabel: Record<string, string> = {
    draft: 'Draft',
    submitted_for_check: 'For Check',
    checked: 'Checked',
    approved_for_submission: 'Approved',
    submitted_to_middleware: 'Submitted',
    cleared: 'Cleared',
    reported: 'Reported',
    rejected: 'Rejected',
    failed_submission: 'Failed',
    returned_by_checker: 'Returned (Checker)',
    returned_by_approver: 'Returned (Approver)',
  };

  const operationalLogs = (data?.recentAuditLogs || []).filter((log: any) =>
    ['workflow', 'invoices', 'customers', 'integration'].includes(log.category)
  );

  return (
    <div className="animate-pro">
      <div className="mb-5">
        <h1 className="h1">Dashboard Overview</h1>
        <p className="text-small">Track onboarding progress and invoice workflow operations from one place.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card-pro p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bg}`}>
                <Icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.name}</p>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-pro p-4">
          <h3 className="h3 mb-3">Recent Invoices</h3>
          <div className="space-y-2">
            {(data?.recentInvoices || []).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-50 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-[12px] font-bold text-gray-900">{inv.invoiceNumber}</p>
                  <p className="text-[10px] text-gray-400">{inv.customerSnapshot?.registrationName} · SAR {inv.totalAmount}</p>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${statusColorMap[inv.status] || 'bg-gray-100 text-gray-500'}`}>
                  {statusLabel[inv.status] || inv.status}
                </span>
              </div>
            ))}
            {(!data?.recentInvoices || data.recentInvoices.length === 0) && (
              <p className="text-[11px] text-gray-300 italic py-4 text-center">No invoices yet</p>
            )}
          </div>
          <Link href="/bank/invoices" className="block mt-3 text-[11px] font-bold text-blue-600 hover:underline">
            View all invoices →
          </Link>
        </div>

        <div className="card-pro p-4">
          <h3 className="h3 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {operationalLogs.slice(0, 6).map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-[11px] font-medium text-gray-800">{log.message}</p>
                  <p className="text-[9px] text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-[8px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded uppercase">{log.category}</span>
              </div>
            ))}
            {operationalLogs.length === 0 && (
              <p className="text-[11px] text-gray-300 italic py-4 text-center">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
