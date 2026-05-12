import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * MASTER BANKS API: GET (List all banks), POST (Register new bank)
 */
export async function GET() {
    try {
        const { data: banks, error } = await supabaseAdmin
            .from('organizations')
            .select(`
                id,
                name,
                tax_number,
                vat_number,
                zatca_profiles (
                    production_csid
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            banks: banks.map(b => ({
                id: b.id,
                name: b.name,
                tax_number: b.tax_number,
                vat_number: b.vat_number,
                production_csid: b.zatca_profiles?.[0]?.production_csid
            }))
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, taxNumber, vatNumber } = body;

        if (!name || !taxNumber || !vatNumber) {
            return NextResponse.json({ error: 'Name, Tax Number, and VAT Number are required' }, { status: 400 });
        }

        // 1. Register the Bank
        const bank = await AuthService.registerBank(name, taxNumber, vatNumber);

        // 2. Generate a fresh API Key
        const { rawKey } = await AuthService.generateAPIKey(bank.id, 'Production Bridge Key');

        // 3. Ensure a ZATCA profile exists
        await supabaseAdmin.from('zatca_profiles').upsert({
            organization_id: bank.id,
        });

        return NextResponse.json({
            success: true,
            message: 'Bank unit provisioned successfully',
            api_key: rawKey,
            bank_id: bank.id
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
