import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { supabaseAdmin } from '@/lib/supabase';
import { BusinessCentralClient } from '@/lib/bc/client';

/**
 * GET /api/bc/config
 * Retrieves Business Central configuration for the authenticated tenant.
 * The client secret is never returned.
 */
export async function GET(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const org = await AuthService.validateAPIKey(apiKey) as any;
    if (!org) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('bc_config')
            .select('bc_tenant_id, bc_environment, bc_company_id, bc_client_id, bc_api_base_url, auto_submit, status, last_sync')
            .eq('organization_id', org.id)
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            config: data || {
                bc_tenant_id: '',
                bc_environment: 'Production',
                bc_company_id: '',
                bc_client_id: '',
                bc_api_base_url: '',
                auto_submit: true,
                status: 'disconnected',
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * POST /api/bc/config
 * Handles saving config, testing the connection, and listing companies.
 * Body: { tenantId, environment, companyId, clientId, clientSecret?, apiBaseUrl?, autoSubmit?, action }
 * action: 'save' | 'test' | 'companies'
 */
export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const org = await AuthService.validateAPIKey(apiKey) as any;
    if (!org) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            tenantId,
            environment = 'Production',
            companyId,
            clientId,
            clientSecret,
            apiBaseUrl,
            autoSubmit = true,
            action = 'save',
        } = body;

        // companyId isn't required for the 'companies' lookup helper.
        const needsCompany = action !== 'companies';
        if (!tenantId || !environment || !clientId || (needsCompany && !companyId)) {
            return NextResponse.json(
                { error: 'Tenant ID, Environment, Client ID' + (needsCompany ? ', and Company ID' : '') + ' are required' },
                { status: 400 }
            );
        }

        // Reuse the stored secret when the form leaves the field blank.
        let finalSecret = clientSecret;
        if (!finalSecret) {
            const { data: existing } = await supabaseAdmin
                .from('bc_config')
                .select('bc_client_secret')
                .eq('organization_id', org.id)
                .maybeSingle();
            finalSecret = existing?.bc_client_secret;
        }

        if (!finalSecret) {
            return NextResponse.json({ error: 'Client Secret is required' }, { status: 400 });
        }

        const bc = new BusinessCentralClient({
            tenantId,
            environment,
            companyId: companyId || '00000000-0000-0000-0000-000000000000',
            clientId,
            clientSecret: finalSecret,
            apiBaseUrl,
        });

        // ------------------------------------------
        // ACTION: LIST COMPANIES (discovery helper)
        // ------------------------------------------
        if (action === 'companies') {
            try {
                const companies = await bc.listCompanies();
                return NextResponse.json({ success: true, companies });
            } catch (e: any) {
                return NextResponse.json({ success: false, error: e.message }, { status: 422 });
            }
        }

        // ------------------------------------------
        // ACTION: TEST CONNECTION
        // ------------------------------------------
        if (action === 'test') {
            const testResult = await bc.testConnection();
            if (!testResult.success) {
                return NextResponse.json({ success: false, error: testResult.error }, { status: 422 });
            }
            return NextResponse.json({
                success: true,
                message: `Connected to Business Central${testResult.companyName ? ` company "${testResult.companyName}"` : ''}.`,
            });
        }

        // ------------------------------------------
        // ACTION: SAVE CONFIG
        // ------------------------------------------
        if (action === 'save') {
            const testResult = await bc.testConnection();
            const configStatus = testResult.success ? 'connected' : 'disconnected';

            const dbData: Record<string, any> = {
                organization_id: org.id,
                bc_tenant_id: tenantId,
                bc_environment: environment,
                bc_company_id: companyId,
                bc_client_id: clientId,
                bc_api_base_url: apiBaseUrl || null,
                auto_submit: autoSubmit,
                status: configStatus,
                updated_at: new Date().toISOString(),
            };

            // Only persist a new secret when the user actually typed one.
            if (clientSecret) {
                dbData.bc_client_secret = clientSecret;
            }

            const { error: upsertError } = await supabaseAdmin
                .from('bc_config')
                .upsert(dbData, { onConflict: 'organization_id' });

            if (upsertError) throw upsertError;

            if (!testResult.success) {
                return NextResponse.json({
                    success: true,
                    status: 'saved_disconnected',
                    message: `Settings saved but connection check failed: ${testResult.error}`,
                });
            }

            return NextResponse.json({
                success: true,
                status: 'saved_connected',
                message: 'Business Central configuration saved and connection verified successfully!',
            });
        }

        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
