import { jsPDF } from 'jspdf';

/**
 * Z3C MIDDLEWARE: INSTITUTIONAL-GRADE PDF ENGINE (A4)
 * Hardened for Production - v3.0
 */

interface PDFInput {
    invoice: any;
    qrCode: string;
    hash?: string;
}

export async function generateInvoicePDF(data: PDFInput): Promise<Buffer> {
    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true
        });

        const m = 18;
        const pw = 210;
        const cw = pw - (m * 2);
        const p = data.invoice.payload || {};

        // --- 1. HEADER ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(20, 50, 150);
        const typeLabel = (p.type === 'simplified' || data.invoice.invoice_type === 'simplified')
            ? 'SIMPLIFIED TAX INVOICE' : 'TAX INVOICE';
        doc.text(typeLabel, m, 25);

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        doc.text('Institutional Compliance - ZATCA Phase 2', m, 32);

        // Clearance Badge
        if (data.invoice.status === 'cleared') {
            doc.setFillColor(240, 255, 240);
            doc.roundedRect(pw - m - 30, 18, 30, 8, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(50, 150, 50);
            doc.text('CLEARED', pw - m - 15, 23, { align: 'center' });
        }

        // --- 2. IDENTITY BLOCKS ---
        let y = 45;
        doc.setFontSize(10);
        doc.setTextColor(20, 50, 150);
        doc.text('SELLER DETAILS', m, y);
        doc.text('DOCUMENT SUMMARY', m + (cw / 2) + 5, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(50);
        doc.text(p.seller?.partyLegalEntity?.registrationName || 'KSA Banking Node', m, y + 6);
        doc.text(`Invoice No: ${data.invoice.invoice_number}`, m + (cw / 2) + 5, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`VAT ID: ${p.seller?.partyTaxScheme?.companyID || '300000000000003'}`, m, y + 11);
        doc.text(`Date: ${new Date(data.invoice.created_at).toLocaleString()}`, m + (cw / 2) + 5, y + 11);

        y += 25;
        doc.setDrawColor(240);
        doc.line(m, y, pw - m, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(20, 50, 150);
        doc.text('BUYER DETAILS', m, y);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(50);
        doc.text(p.buyer?.partyLegalEntity?.registrationName || 'Account Holder', m, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`VAT ID: ${p.buyer?.partyTaxScheme?.companyID || 'UNREGISTERED'}`, m, y + 11);

        // --- 3. QR HUB (SAFETY WRAPPED) ---
        if (data.qrCode) {
            try {
                const qrSize = 45;
                const qrx = pw - m - qrSize;
                const qry = y - 5;

                // Ensure Base64 prefix
                let qrImage = data.qrCode;
                if (!qrImage.startsWith('data:image')) {
                    qrImage = `data:image/png;base64,${qrImage}`;
                }

                doc.addImage(qrImage, 'PNG', qrx, qry, qrSize, qrSize);
            } catch (qrErr) {
                console.warn('[PDF-QR-WARN]: QR failed to render, skipping image.');
            }
        }

        // --- 4. TABLE ---
        y += 35;
        doc.setFillColor(20, 50, 150);
        doc.rect(m, y, cw, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255);
        doc.text('Description', m + 2, y + 6.5);
        doc.text('VAT%', m + 120, y + 6.5);
        doc.text('Total (Inc. VAT)', pw - m - 2, y + 6.5, { align: 'right' });

        y += 10;
        doc.setTextColor(50);
        doc.setFont('helvetica', 'normal');
        const items = p.items || [];
        items.forEach((item: any) => {
            const total = item.quantity * item.unitPrice * (1 + (item.vatRate / 100));
            doc.text(item.name || 'Financial Service', m + 2, y + 7);
            doc.text(`${item.vatRate}%`, m + 120, y + 7);
            doc.setFont('helvetica', 'bold');
            doc.text(total.toFixed(2), pw - m - 2, y + 7, { align: 'right' });
            y += 10;
        });

        // --- 5. SUMMARY ---
        y += 10;
        const subTotal = items.reduce((acc: number, x: any) => acc + (x.quantity * x.unitPrice), 0);
        const vatTotal = items.reduce((acc: number, x: any) => acc + (x.quantity * x.unitPrice * (x.vatRate / 100)), 0);
        const grand = subTotal + vatTotal;

        doc.setFontSize(14);
        doc.setTextColor(20, 50, 150);
        doc.text('GRAND TOTAL', pw - m - 70, y);
        doc.text(`${grand.toFixed(2)} SAR`, pw - m - 2, y, { align: 'right' });

        // --- 6. FOOTER ---
        doc.setFontSize(7);
        doc.setTextColor(180);
        doc.text(`UUID: ${data.invoice.id} | Hash: ${data.hash || 'N/A'}`, m, 280);
        doc.text('Certified Electronic Invoice (Bank of Jordan Middleware Node)', m, 284);

        return Buffer.from(doc.output('arraybuffer'));
    } catch (fullError: any) {
        console.error('[CRITICAL-PDF-FATAL]:', fullError.message);
        throw new Error(`PDF Reconstruction Failed: ${fullError.message}`);
    }
}
