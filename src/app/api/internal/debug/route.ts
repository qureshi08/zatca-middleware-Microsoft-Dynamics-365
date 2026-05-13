import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: banks, error: bErr } = await supabaseAdmin.from('organizations').select('*');
        const { data: keys, error: kErr } = await supabaseAdmin.from('api_keys').select('*');
        const { data: profiles, error: pErr } = await supabaseAdmin.from('zatca_profiles').select('*');

        return NextResponse.json({
            banks_count: banks?.length || 0,
            keys_count: keys?.length || 0,
            profiles_count: profiles?.length || 0,
            banks: banks || [],
            keys: keys || [],
            profiles: profiles || []
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
