'use server';

import { buildAndGenerateXML, updateInvoiceWithSignature } from './xml/builder';
import { hashInvoiceForSubmission, generatePreviousInvoiceHash } from './crypto/hash';
import { signInvoiceHash } from './crypto/signing';
import { generateCompleteQRCode, formatTimestampForQR } from './qr/generator';
import { TEST_SELLER } from './test-data';
import { SimpleInvoiceInput } from './xml/builder';
import { getOnboardingStatus } from './onboarding-storage';
import { supabaseAdmin } from '../supabase';

import { generateZATCASignatureXML } from './xml/signature';
import { getCertificateHash, parseCertificate, getCertificateSignature } from './crypto/signing';
import { validateInvoiceCompliance } from './xml/validator';
import { submitClearance, submitReporting } from './api/client';
import { processZATCATransaction } from './transactions';

export async function validateInvoiceAction(xml: string) {
    try {
        const result = await validateInvoiceCompliance(xml);
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Generates and signs a ZATCA-compliant invoice for a specific organization
 */
export async function generateInvoiceAction(input: SimpleInvoiceInput, orgId: string) {
    try {
        // 1. Get stored onboarding info for this organization
        const status = await getOnboardingStatus(orgId);
        if (!status.privateKey || !(status.complianceCSID || status.productionCSID)) {
            throw new Error('Bank system not registered on ZATCA. Please complete onboarding first.');
        }

        const privateKey = status.privateKey;
        const certificate = status.productionCSID || status.complianceCSID!;

        // 2. Fetch or generate previous invoice hash for this organization
        // In a real multi-tenant app, we'd query the organization's last successful transaction
        const previousInvoiceHash = generatePreviousInvoiceHash(null);

        // 3. Build invoice
        const { invoice, xml } = buildAndGenerateXML({
            ...input,
            seller: TEST_SELLER, // TODO: Replace with dynamic organization details
            previousInvoiceHash,
        });

        // 4. Hash invoice
        const invoiceHash = hashInvoiceForSubmission(xml);

        // 5. Sign hash
        const signature = signInvoiceHash(invoiceHash, privateKey);

        // 6. Prepare XAdES Signature Block
        const certHash = getCertificateHash(certificate);
        const { issuerName, serialNumber } = parseCertificate(certificate);
        const signingTime = new Date().toISOString();

        const signatureXML = generateZATCASignatureXML({
            invoiceHash,
            signatureValue: signature,
            certificate: certificate.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s/g, ''),
            signingTime,
            certHash,
            certIssuer: issuerName,
            certSerialNumber: serialNumber
        });

        // 7. Generate QR code
        const certSignature = getCertificateSignature(certificate);
        const { tlvData, qrCodeImage } = await generateCompleteQRCode({
            sellerName: TEST_SELLER.partyLegalEntity.registrationName,
            vatRegistrationNumber: TEST_SELLER.partyTaxScheme.companyID,
            timestamp: formatTimestampForQR(new Date()),
            invoiceTotal: invoice.legalMonetaryTotal.taxInclusiveAmount,
            vatTotal: invoice.taxTotal[0].taxAmount,
            invoiceHash,
            ecdsaSignature: signature,
            ecdsaPublicKey: status.publicKey || '',
            certificateSignature: certSignature,
        });

        // 8. Update XML with signature and QR
        const signedXML = updateInvoiceWithSignature(xml, signatureXML, tlvData);

        // 9. Execute ZATCA Transaction (Clearance or Reporting)
        const transResult = await processZATCATransaction(
            signedXML,
            input.type,
            invoice.id,
            invoice.uuid,
            orgId
        );

        if (!transResult.success) {
            throw new Error(`ZATCA Verification Failed: ${transResult.error || 'Check validation results'}`);
        }

        const resultData = {
            id: invoice.id,
            uuid: invoice.uuid,
            type: input.type,
            status: transResult.status, // CLEARED or REPORTED
            validationMessages: transResult.validationMessages,
            xml: transResult.clearedXml || signedXML,
            qrCode: qrCodeImage,
            hash: invoiceHash,
            signature,
            createdAt: new Date().toISOString(),
        };

        return { success: true, data: resultData };

    } catch (error: any) {
        console.error('SERVER ACTION ERROR:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate invoice'
        };
    }
}

export async function reportInvoiceAction(
    xml: string,
    type: 'standard' | 'simplified',
    invoiceId: string,
    uuid: string,
    orgId: string
) {
    try {
        // Pass orgId to transaction processor to ensure it uses correct CSID
        const result = await processZATCATransaction(xml, type, invoiceId, uuid, orgId);

        // Log results to Supabase transaction logs
        await supabaseAdmin.from('transaction_logs').insert({
            organization_id: orgId,
            request_type: result.status === 'REPORTED' ? 'reporting' : 'clearance',
            invoice_number: invoiceId,
            invoice_hash: uuid,
            status: result.success ? 'success' : 'failure',
            response_payload: result
        });

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                details: result.validationMessages
            };
        }

        return {
            success: true,
            status: result.status,
            data: result,
            clearedInvoice: result.clearedXml
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetch transaction logs for an organization
 */
export async function getTransactionLogsAction(orgId: string) {
    if (!orgId) return [];

    const { data, error } = await supabaseAdmin
        .from('transaction_logs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Failed to fetch transaction logs:', error);
        return [];
    }
    return data || [];
}

