import { getQuickbooksAccessToken } from './auth';

export async function fetchInvoiceFromQuickbooks(
  realmId: string,
  invoiceId: string
) {
  const token = await getQuickbooksAccessToken();
  const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/invoice/${invoiceId}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`QBO fetch error: ${txt}`);
  }
  const data = await resp.json();
  return data.Invoice;
}
