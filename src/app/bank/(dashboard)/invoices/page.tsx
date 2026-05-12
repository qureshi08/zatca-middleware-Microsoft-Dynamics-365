'use client';

import { useEffect, useState } from 'react';
import { useBankAuthStore } from '@/store/bankAuthStore';
import Link from 'next/link';
import { Search, Plus, Filter, ArrowRight, Clock, CheckCircle2, AlertCircle, Send, ShieldCheck, Stamp } from 'lucide-react';

export default function BankInvoicesAllPage() {
  const { sessionToken, role } = useBankAuthStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadInvoices = async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bank/product/invoices', {
        headers: { 'x-session-token': sessionToken },
      });
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [sessionToken]);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.customerSnapshot?.registrationName?.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabel: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Created', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
    returned_by_checker: { label: 'Returned (Checker)', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle },
    submitted_for_check: { label: 'For Check', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Send },
    checked: { label: 'Checked', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: ShieldCheck },
    returned_by_approver: { label: 'Returned (Approver)', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
    approved_for_submission: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Stamp },
    submitted_to_middleware: { label: 'Submitted', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Send },
    cleared: { label: 'Cleared', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    reported: { label: 'Reported', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
    failed_submission: { label: 'Failed', color: 'bg-red-50 text-red-600 border-red-100', icon: AlertCircle },
  };

  return (
    <div className="animate-pro">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="h1">Invoice Directory</h1>
          <p className="text-small">Complete record of every invoice and its current workflow status.</p>
        </div>
        {(role === 'Maker' || role === 'Admin') && (
          <Link href="/bank/invoices/new" className="btn-pro h-9 px-4 flex items-center gap-2">
            <Plus size={16} />
            <span>Create Invoice</span>
          </Link>
        )}
      </div>

      <div className="card-pro p-1.5 flex items-center gap-2 mb-4 bg-gray-50/50">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by invoice number or customer..." 
            className="input-pro pl-9 h-9 border-transparent focus:border-blue-500/20 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="h-9 px-3 flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all">
          <Filter size={14} />
          <span>Filter</span>
        </button>
      </div>

      <div className="card-pro overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Details</th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total (SAR)</th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="p-3"><div className="h-4 bg-gray-100 rounded-md w-full"></div></td>
                </tr>
              ))
            ) : filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => {
                const status = statusLabel[inv.status] || { label: inv.status, color: 'bg-gray-100', icon: Clock };
                const StatusIcon = status.icon;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-3">
                      <div className="text-[12px] font-bold text-gray-900">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-gray-400">{new Date(inv.createdAt).toLocaleDateString()} · {inv.type}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-[11px] font-medium text-gray-700">{inv.customerSnapshot?.registrationName}</div>
                      <div className="text-[9px] text-gray-400">VAT: {inv.customerSnapshot?.vatNumber}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="text-[12px] font-black text-gray-900">{inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="text-[9px] text-gray-400">VAT: {inv.vatAmount}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${status.color}`}>
                        <StatusIcon size={10} />
                        {status.label}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Link 
                        href={`/bank/invoices/${inv.id}`} 
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Details
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-10 text-center text-small text-gray-400">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
