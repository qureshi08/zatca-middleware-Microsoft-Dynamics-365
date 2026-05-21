const { generateInvoicePDF } = require('./src/lib/zatca/pdf/generator');
const fs = require('fs');
const path = require('path');

const odooInvoice = {
    invoiceId: 'INV/2026/00001',
    type: 'simplified',
    items: [
        { name: 'Consulting Service', quantity: 2, unitPrice: 100, vatRate: 15 }
    ]
};

const resultData = {
    status: 'CLEARED',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    hash: 'JYnLSWYEF0VUg1TYFA+tER7y8G5l1QvLQwHnf26sDao=',
    seller: {
        partyLegalEntity: { registrationName: 'Test Seller Ltd' },
        partyTaxScheme: { companyID: '300000000000003' }
    }
};

async function run() {
    try {
        const buf = await generateInvoicePDF({
            invoice: {
                invoice_number: odooInvoice.invoiceId,
                invoice_type: odooInvoice.type,
                status: 'cleared',
                created_at: new Date().toISOString(),
                payload: {
                    ...odooInvoice,
                    seller: resultData.seller,
                    items: odooInvoice.items,
                }
            },
            qrCode: resultData.qrCode,
            hash: resultData.hash
        });
        fs.writeFileSync(path.join(__dirname, 'test_real_gen.pdf'), buf);
        console.log('Real Gen PDF size:', buf.length);
        console.log('Real Gen PDF header:', buf.toString('ascii', 0, 8));
    } catch (e) {
        console.error('Error:', e);
    }
}
run();
