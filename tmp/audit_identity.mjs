import { supabaseAdmin } from './src/lib/supabase.js';

async function audit_keys() {
    console.log("--- SECURE IDENTITY AUDIT ---");

    // 1. Get Organizations
    const { data: orgs, error: e1 } = await supabaseAdmin.from('organizations').select('id, name, tax_number');
    if (e1) {
        console.error("❌ Database Connection Failed:", e1.message);
        return;
    }

    console.log(`Found ${orgs.length} nodes:`);
    for (const org of orgs) {
        console.log(`- ${org.name} (ID: ${org.id}, TIN: ${org.tax_number})`);

        // 2. Get Keys for this Org
        const { data: keys } = await supabaseAdmin
            .from('api_keys')
            .select('key_prefix, status, created_at')
            .eq('organization_id', org.id);

        if (keys && keys.length > 0) {
            keys.forEach(k => {
                console.log(`  > Key Prefix: ${k.key_prefix}... Status: ${k.status} (Created: ${k.created_at})`);
            });
        } else {
            console.log(`  > ⚠️ NO ACTIVE KEYS FOUND FOR THIS NODE.`);
        }
    }
}

audit_keys();
