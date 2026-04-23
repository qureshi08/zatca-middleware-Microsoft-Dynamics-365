'use client';

import { useEffect, useState } from 'react';
import { useBankAuthStore } from '@/store/bankAuthStore';

export default function BankCustomersPage() {
  const { sessionToken } = useBankAuthStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerCode: '',
    registrationName: '',
    vatNumber: '',
    identificationScheme: 'CRN',
    identificationNumber: '',
    email: '',
    phone: '',
    streetName: '',
    buildingNumber: '',
    citySubdivisionName: '',
    cityName: '',
    postalZone: '',
    country: 'SA',
  });

  const loadCustomers = async () => {
    if (!sessionToken) return;
    const res = await fetch('/api/bank/product/customers', { headers: { 'x-session-token': sessionToken } });
    const data = await res.json().catch(() => ({}));
    setCustomers(data.customers || []);
  };

  useEffect(() => {
    void loadCustomers();
  }, [sessionToken]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!form.customerCode.trim()) { setError('Customer code is required'); return; }
    if (!form.registrationName.trim()) { setError('Registration name is required'); return; }
    if (!/^\d{15}$/.test(form.vatNumber)) { setError('VAT number must be exactly 15 digits'); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Invalid email format'); return; }
    if (form.phone && !/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ''))) { setError('Phone must be 7-15 digits'); return; }
    if (!form.streetName.trim()) { setError('Street name is required'); return; }
    if (!form.cityName.trim()) { setError('City name is required'); return; }
    if (!/^\d{5}$/.test(form.postalZone)) { setError('Postal zone must be exactly 5 digits'); return; }
    if (form.buildingNumber && !/^\d{1,10}$/.test(form.buildingNumber)) { setError('Building number must be numeric'); return; }

    const res = await fetch('/api/bank/product/customers', {
      method: 'POST',
      headers: { 'x-session-token': sessionToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: form.customerCode.trim(),
        registrationName: form.registrationName.trim(),
        vatNumber: form.vatNumber,
        identificationScheme: form.identificationScheme,
        identificationNumber: form.identificationNumber.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: {
          streetName: form.streetName.trim(),
          buildingNumber: form.buildingNumber.trim(),
          citySubdivisionName: form.citySubdivisionName.trim(),
          cityName: form.cityName.trim(),
          postalZone: form.postalZone,
          country: form.country.toUpperCase(),
        },
        status: 'active',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data?.error || 'Failed to save customer'); return; }
    setSuccess('Customer created successfully');
    setForm({
      customerCode: '', registrationName: '', vatNumber: '', identificationScheme: 'CRN',
      identificationNumber: '', email: '', phone: '', streetName: '', buildingNumber: '',
      citySubdivisionName: '', cityName: '', postalZone: '', country: 'SA',
    });
    await loadCustomers();
  };

  return (
    <div className="animate-pro">
      <div className="mb-5">
        <h1 className="h1">Customers</h1>
        <p className="text-small">Maintain customer master data for invoice creation.</p>
      </div>

      {error && <div className="bank-alert-error mb-4">{error}</div>}
      {success && <div className="bank-alert-success mb-4">{success}</div>}

      <div className="card-pro p-4 mb-5">
        <h3 className="h3 mb-3">Add Customer</h3>
        <form onSubmit={saveCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bank-form-group">
            <label className="bank-form-label">Customer Code <span className="text-red-400">*</span></label>
            <input className="input-pro" value={form.customerCode} onChange={(e) => updateField('customerCode', e.target.value)} placeholder="e.g. CUST-001" required />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">Registration Name <span className="text-red-400">*</span></label>
            <input className="input-pro" value={form.registrationName} onChange={(e) => updateField('registrationName', e.target.value)} placeholder="Company Legal Name" required />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">VAT Number <span className="text-red-400">*</span> <span className="text-[9px] text-gray-400">(15 digits)</span></label>
            <input className="input-pro" value={form.vatNumber} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 15); updateField('vatNumber', v); }} placeholder="300000000000003" maxLength={15} required />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">ID Number</label>
            <input className="input-pro" value={form.identificationNumber} onChange={(e) => updateField('identificationNumber', e.target.value)} placeholder="e.g. 1010000000" />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">Email</label>
            <input className="input-pro" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="buyer@example.com" />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">Phone <span className="text-[9px] text-gray-400">(digits only)</span></label>
            <input className="input-pro" value={form.phone} onChange={(e) => { const v = e.target.value.replace(/[^\d+]/g, ''); updateField('phone', v); }} placeholder="+966501234567" />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">Street Name <span className="text-red-400">*</span></label>
            <input className="input-pro" value={form.streetName} onChange={(e) => updateField('streetName', e.target.value)} placeholder="King Fahd Road" required />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">Building Number <span className="text-[9px] text-gray-400">(numeric)</span></label>
            <input className="input-pro" value={form.buildingNumber} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); updateField('buildingNumber', v); }} placeholder="1234" />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">City <span className="text-red-400">*</span></label>
            <input className="input-pro" value={form.cityName} onChange={(e) => updateField('cityName', e.target.value)} placeholder="Riyadh" required />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">District</label>
            <input className="input-pro" value={form.citySubdivisionName} onChange={(e) => updateField('citySubdivisionName', e.target.value)} placeholder="Al Olaya" />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">Postal Code <span className="text-red-400">*</span> <span className="text-[9px] text-gray-400">(5 digits)</span></label>
            <input className="input-pro" value={form.postalZone} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 5); updateField('postalZone', v); }} placeholder="12345" maxLength={5} required />
          </div>
          <div className="bank-form-group">
            <label className="bank-form-label">Country <span className="text-[9px] text-gray-400">(ISO 2-letter)</span></label>
            <input className="input-pro" value={form.country} onChange={(e) => { const v = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2); updateField('country', v); }} placeholder="SA" maxLength={2} />
          </div>
          <div className="md:col-span-2 pt-2">
            <button type="submit" className="btn-pro h-8 px-5">Save Customer</button>
          </div>
        </form>
      </div>

      <div className="card-pro p-4">
        <h3 className="h3 mb-3">Customer Directory ({customers.length})</h3>
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c.id} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-bold text-gray-900">{c.registrationName}</p>
                  <p className="text-[10px] text-gray-400">{c.customerCode} · VAT: {c.vatNumber}</p>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {c.address.streetName}, {c.address.cityName}, {c.address.country} {c.address.postalZone}
              </p>
            </div>
          ))}
          {customers.length === 0 && <p className="text-[11px] text-gray-300 italic text-center py-6">No customers yet. Create one above.</p>}
        </div>
      </div>
    </div>
  );
}
