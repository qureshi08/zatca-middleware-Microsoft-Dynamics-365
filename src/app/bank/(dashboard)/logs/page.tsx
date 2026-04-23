'use client';

import { useEffect, useState } from 'react';
import { useBankAuthStore } from '@/store/bankAuthStore';
import { ListRestart, Shield, User, Database, Globe, Receipt, Filter, Search } from 'lucide-react';

export default function BankAuditLogsPage() {
  const { sessionToken } = useBankAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!sessionToken) return;
    fetch('/api/bank/product/logs', { headers: { 'x-session-token': sessionToken } })
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [sessionToken]);

  const categoryIcon: Record<string, any> = {
    auth: Shield,
    customers: User,
    invoices: Receipt,
    workflow: ListRestart,
    integration: Globe,
    cbs: Database,
  };

  const categoryColor: Record<string, string> = {
    auth: 'text-purple-500 bg-purple-50',
    customers: 'text-blue-500 bg-blue-50',
    invoices: 'text-emerald-500 bg-emerald-50',
    workflow: 'text-indigo-500 bg-indigo-50',
    integration: 'text-amber-500 bg-amber-50',
    cbs: 'text-gray-500 bg-gray-50',
  };

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.actorEmail?.toLowerCase().includes(search.toLowerCase()) ||
    log.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-pro">
      <div className="mb-6">
        <h1 className="h1">System Audit Logs</h1>
        <p className="text-small">Immutable tracking of all user actions and system events within the product portal.</p>
      </div>

      <div className="card-pro p-1.5 flex items-center gap-2 mb-4 bg-gray-50/50 border-transparent shadow-none ring-1 ring-gray-100">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by event or user email..." 
            className="input-pro pl-9 h-8 border-transparent focus:border-blue-500/10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="h-8 px-3 flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all uppercase tracking-widest">
          <Filter size={14} />
          Filter
        </button>
      </div>

      <div className="card-pro overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="p-4"><div className="h-4 bg-gray-50 rounded" /></td>
                  </tr>
                 ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const Icon = categoryIcon[log.category] || Database;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-[11px] font-bold text-gray-900 tabular-nums">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-gray-400 tabular-nums">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-[12px] font-medium text-gray-800 leading-snug">{log.message}</div>
                        {log.targetId && <div className="text-[9px] text-gray-300 font-mono mt-0.5">Target: {log.targetId}</div>}
                      </td>
                      <td className="p-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${categoryColor[log.category] || 'bg-gray-50 text-gray-400'}`}>
                          <Icon size={10} />
                          {log.category}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-[11px] font-bold text-gray-700">{log.actorEmail || 'System'}</div>
                        <div className="text-[9px] text-gray-400 font-medium">User ID: {log.actorUserId?.slice(0, 8) || 'N/A'}...</div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-[11px] font-bold text-gray-300 uppercase tracking-widest italic">No matching logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
