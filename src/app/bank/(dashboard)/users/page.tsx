'use client';

import { useEffect, useState } from 'react';
import { useBankAuthStore } from '@/store/bankAuthStore';
import { Users, UserPlus, Shield, Mail, Calendar, Key, AlertCircle } from 'lucide-react';

export default function BankUsersPage() {
  const { sessionToken, role } = useBankAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'Maker' as 'Admin' | 'Maker' | 'Checker' | 'Approver' | 'Auditor',
    password: 'ChangeMe123!'
  });

  const loadUsers = async () => {
    if (!sessionToken || role !== 'Admin') return;
    try {
      const res = await fetch('/api/bank/product/users', { headers: { 'x-session-token': sessionToken } });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [sessionToken, role]);

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/bank/product/users', {
        method: 'POST',
        headers: { 'x-session-token': sessionToken, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('User created successfully');
      setForm({ fullName: '', email: '', role: 'Maker', password: 'ChangeMe123!' });
      loadUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <Shield size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">Access Restricted</h2>
          <p className="text-small">Only system administrators can manage user accounts.</p>
        </div>
      </div>
    );
  }

  const roleColor: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-700 border-purple-200',
    Maker: 'bg-blue-100 text-blue-700 border-blue-200',
    Checker: 'bg-amber-100 text-amber-700 border-amber-200',
    Approver: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Auditor: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="animate-pro">
      <div className="mb-6">
        <h1 className="h1">Staff Management</h1>
        <p className="text-small">Define user roles and control access permissions across the bank portal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="card-pro p-5 border-blue-100 ring-1 ring-blue-50/50">
            <div className="flex items-center gap-2 mb-4 text-blue-600">
              <UserPlus size={18} />
              <h3 className="h3">Provision New User</h3>
            </div>
            
            <form onSubmit={saveUser} className="space-y-4">
              {error && <div className="bank-alert-error mb-2">{error}</div>}
              {success && <div className="bank-alert-success mb-2">{success}</div>}
              
              <div className="bank-form-group">
                <label className="bank-form-label text-[10px] font-black uppercase">Full Name</label>
                <input className="input-pro" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Doe" required />
              </div>
              
              <div className="bank-form-group">
                <label className="bank-form-label text-[10px] font-black uppercase">Work Email</label>
                <input type="email" className="input-pro" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@bank.com" required />
              </div>

              <div className="bank-form-group">
                <label className="bank-form-label text-[10px] font-black uppercase">App Permission Role</label>
                <select className="input-pro" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                  <option value="Maker">Maker (Creates Invoices)</option>
                  <option value="Checker">Checker (Verifies Data)</option>
                  <option value="Approver">Approver (Final Signs)</option>
                  <option value="Auditor">Auditor (View Only)</option>
                  <option value="Admin">Admin (Full Access)</option>
                </select>
              </div>

              <div className="bank-form-group">
                <label className="bank-form-label text-[10px] font-black uppercase">Initial Password</label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-2.5 text-gray-300" />
                  <input className="input-pro pl-9" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
                <p className="text-[9px] text-gray-400 mt-1">User will be prompted to rotate password on first login.</p>
              </div>

              <button type="submit" className="btn-pro w-full h-9 mt-2 flex items-center justify-center gap-2" disabled={isSaving}>
                {isSaving ? 'Provisioning...' : 'Add Staff Member'}
                {!isSaving && <UserPlus size={14} />}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="card-pro overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name & Role</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(3)].map((_, i) => <tr key={i}><td colSpan={4} className="p-10 text-center animate-pulse text-gray-200">Loading directory...</td></tr>)
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-[12px]">
                        <div className="font-bold text-gray-900">{u.fullName}</div>
                        <div className={`mt-1 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${roleColor[u.role] || 'bg-gray-50'}`}>
                          <Shield size={10} />
                          {u.role}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                          <Mail size={12} className="text-gray-400" />
                          {u.email}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right text-[10px] text-gray-400">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar size={12} />
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
