'use client';

import { Eye, Info, Receipt, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BankNotesPage() {
  return (
    <div className="animate-pro max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="h1">Credit & Debit Notes</h1>
        <p className="text-small text-gray-500">Manage adjustments and corrections for previously submitted invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card-pro p-6 border-blue-100 bg-gradient-to-br from-blue-50/30 to-white">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
            <Receipt size={24} />
          </div>
          <h3 className="text-[15px] font-black text-gray-900 uppercase tracking-tight mb-2">Credit Notes (Type 381)</h3>
          <p className="text-[11px] text-gray-500 leading-relaxed mb-6">
            Issue a credit note when you need to decrease the amount of a previously cleared invoice, such as for returns or over-billing corrections.
          </p>
          <div className="p-3 rounded-xl bg-white border border-blue-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
            <span>ZATCA Policy: Required</span>
            <span className="text-blue-500">View Rules</span>
          </div>
        </div>

        <div className="card-pro p-6 border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
            <Receipt size={24} />
          </div>
          <h3 className="text-[15px] font-black text-gray-900 uppercase tracking-tight mb-2">Debit Notes (Type 383)</h3>
          <p className="text-[11px] text-gray-500 leading-relaxed mb-6">
            Use debit notes to increase the amount owed on a previously submitted invoice, typically for additional charges or price adjustments.
          </p>
          <div className="p-3 rounded-xl bg-white border border-indigo-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
            <span>ZATCA Policy: Required</span>
            <span className="text-indigo-500">View Rules</span>
          </div>
        </div>
      </div>

      <div className="card-pro p-8 text-center border-gray-100 bg-gray-50/20">
        <div className="max-w-md mx-auto space-y-4">
           <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 mx-auto">
              <Eye size={32} />
           </div>
           <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">Active Records</h4>
           <p className="text-[11px] text-gray-400 leading-relaxed">
             No active notes found. You can generate a note by selecting a 'Cleared' invoice from your directory and choosing 'Issue Correction'.
           </p>
           <div className="pt-2">
              <Link href="/bank/invoices" className="btn-pro h-9 px-6 bg-white text-gray-700 border-gray-200 hover:bg-gray-100 transition-all inline-flex items-center gap-2">
                Open Invoice Directory
                <ArrowRight size={14} />
              </Link>
           </div>
        </div>
      </div>

      <div className="mt-12 p-6 rounded-2xl bg-slate-900 text-white flex items-start gap-4">
         <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
         <div>
            <h5 className="text-[12px] font-black uppercase text-blue-400 mb-1">Compliance reminder</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ZATCA requires every Credit and Debit note to explicitly reference the UUID of the original tax invoice. The Middleware automatically handles this linkage when you initiate a correction from the historical feed.
            </p>
         </div>
      </div>
    </div>
  );
}
