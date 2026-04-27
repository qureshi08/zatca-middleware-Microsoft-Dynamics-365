import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * ANALYTICS ENGINE: LIVE INTELLIGENCE
 * 
 * GET - Calculate real-time VAT volume, SAR flow, and success rates
 * for the institutional dashboard.
 */

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });

    const org = await AuthService.validateAPIKey(apiKey) as any;
    if (!org) return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });

    try {
        // 1. Fetch all successful transactions for this organization
        // This is our source of truth for the dashboard
        const { data: transactions, error: transactionError } = await supabaseAdmin
            .from('transaction_logs')
            .select('*')
            .eq('organization_id', org.id)
            .eq('status', 'success')
            .order('created_at', { ascending: false });

        if (transactionError) throw transactionError;

        // 2. Calculate metrics from transactions
        const submittedCount = transactions?.length || 0;
        
        // Count processed (CLEARED/REPORTED) invoices
        // We look inside the response_payload to determine the ZATCA status
        const processedTransactions = transactions?.filter(t => {
            const data = t.response_payload?.data || t.response_payload || {};
            const status = (data.status || '').toUpperCase();
            return ['CLEARED', 'REPORTED', 'WARNING'].includes(status);
        }) || [];

        const processedCount = processedTransactions.length;

        let totalSAR = 0;
        let totalVAT = 0;

        processedTransactions.forEach(t => {
            // Extract totals from the original request body stored in response_payload
            // Or from the response data itself
            const payload = t.response_payload?.data || {};
            const requestBody = t.response_payload?.body || {}; // If we log the body
            
            // Try to find total in various locations
            const total = payload.total || requestBody.total || 0;
            const vat = payload.vatAmount || requestBody.vatAmount || 0;
            
            totalSAR += parseFloat(total.toString() || '0');
            totalVAT += parseFloat(vat.toString() || '0');
        });

        // If SAR is still 0, try to calculate from transaction metadata if available
        if (totalSAR === 0) {
            // Fallback to a secondary check if needed, but usually the payload has it
        }

        const successRate = submittedCount > 0 ? (processedCount / submittedCount) * 100 : 0;

        // 3. Map transactions to a standard "Recent Activity" format for the dashboard
        const recent = transactions?.slice(0, 5).map(t => {
            const data = t.response_payload?.data || {};
            return {
                id: t.id,
                invoice_number: t.invoice_number,
                created_at: t.created_at,
                status: (data.status || 'SUCCESS').toLowerCase(),
                total_amount: data.total || 0,
                payload: data
            };
        });

        return NextResponse.json({
            success: true,
            summary: {
                total: submittedCount,
                submittedCount: submittedCount,
                clearedCount: processedCount,
                totalVolumeSAR: totalSAR.toFixed(2),
                totalVatCollected: totalVAT.toFixed(2),
                successRate: `${successRate.toFixed(1)}%`
            },
            recent: recent || []
        });

    } catch (e: any) {
        console.error('[ANALYTICS-ERROR]:', e);
        return NextResponse.json({ error: 'Failed to aggregate live metrics', details: e.message }, { status: 500 });
    }
}
