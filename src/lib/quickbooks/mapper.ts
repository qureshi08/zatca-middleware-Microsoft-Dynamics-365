export function mapQboToZatca(qbo: any) {
  return {
    invoiceNumber: qbo.DocNumber,
    createdAt: qbo.MetaData?.CreateTime,
    type: qbo.TxnTaxDetail?.TaxCode?.value || 'standard',
    totalAmount: Number(qbo.TotalAmt),
    vatAmount: Number(qbo.TxnTaxDetail?.TotalTax ?? 0),
    customerSnapshot: {
      registrationName: qbo.CustomerRef?.name,
      vatNumber: qbo.CustomerMemo?.value || '',
      identificationNumber: qbo.BillAddr?.PostalCode,
      identificationScheme: 'QBO',
      address: qbo.BillAddr?.Line1,
    },
    items: (qbo.Line ?? [])
      .filter((l: any) => l.DetailType === 'SalesItemLineDetail')
      .map((l: any) => ({
        description: l.Description,
        quantity: Number(l.SalesItemLineDetail?.Qty),
        unitPrice: Number(l.SalesItemLineDetail?.UnitPrice),
        taxAmount: Number(l.SalesItemLineDetail?.TaxAmount ?? 0),
      })),
  };
}
