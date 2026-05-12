'use client';
import InvoiceQueueView from '@/components/bank/InvoiceQueueView';

export default function BankApproverQueuePage() {
  return (
    <InvoiceQueueView 
      title="Final Approval Board"
      description="Invoices verified by Checkers that require your final authorization before middleware transmission."
      statusFilter={['checked']}
    />
  );
}
