import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'node:crypto';

/**
 * INSTITUTIONAL LOGIN GATE (v15.1)
 * Custom Auth Engine - Securely validates bank admins against the bank_users registry.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing Credentials' }, { status: 400 });
        }

        // 1. Fetch User from Registry
        const { data: user, error: userError } = await supabaseAdmin
            .from('bank_users')
            .select('*, organizations(*)')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized', details: 'Invalid institutional credentials' }, { status: 401 });
        }

        // 2. Verify Hash
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        if (user.password_hash !== passwordHash) {
            return NextResponse.json({ error: 'Unauthorized', details: 'Invalid institutional credentials' }, { status: 401 });
        }

        // 3. Successful Login - Return Session Data
        const stableKeySnippet = user.organizations.id.replace(/-/g, '').slice(0, 32);
        const apiKey = `sk_zatca_live_${stableKeySnippet}`;

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                organization_id: user.organization_id
            },
            organization: user.organizations,
            apiKey: apiKey
        });

    } catch (e: any) {
        return NextResponse.json({ error: 'Auth Protocol Fault', details: e.message }, { status: 500 });
    }
}
