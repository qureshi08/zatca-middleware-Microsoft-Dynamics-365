'use client';
import InvoiceQueueView from '@/components/bank/InvoiceQueueView';

export default function BankCheckerQueuePage() {
  return (
    <InvoiceQueueView 
      title="Checker Review Queue"
      description="Invoices submitted by Makers that require your primary verification."
      statusFilter={['submitted_for_check']}
    />
  );
}
