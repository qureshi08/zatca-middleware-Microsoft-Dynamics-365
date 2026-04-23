'use client';
import InvoiceQueueView from '@/components/bank/InvoiceQueueView';

export default function BankMakerQueuePage() {
  return (
    <InvoiceQueueView 
      title="Maker Worklist"
      description="Invoices you created that are still in draft or have been returned for corrections."
      statusFilter={['draft', 'returned_by_checker', 'returned_by_approver']}
    />
  );
}
