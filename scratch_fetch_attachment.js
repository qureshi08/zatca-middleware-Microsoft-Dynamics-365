const { createClient } = require('@supabase/supabase-js');
const { OdooClient } = require('./src/lib/odoo/client');

const supabaseUrl = 'https://ieokhrbxchllgfcechko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllb2tocmJ4Y2hsbGdmY2VjaGtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4MzM1NywiZXhwIjoyMDk0NzU5MzU3fQ.bP_AVNVXBhbQmMxiBJvo0wDB9h6d-BDad8PuVhObPRc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    try {
        const { data: configs, error } = await supabase.from('odoo_config').select('*');
        if (error || !configs || configs.length === 0) {
            console.error('Failed to load Odoo config:', error);
            return;
        }

        const config = configs[0];
        const odoo = new OdooClient({
            odooUrl: config.odoo_url,
            odooDb: config.odoo_db,
            odooUsername: config.odoo_username,
            odooPassword: config.odoo_password
        });

        // Authenticate
        const uid = await odoo['request']('common', 'authenticate', [
            config.odoo_db,
            config.odoo_username,
            config.odoo_password,
            {}
        ]);
        console.log('Authenticated UID:', uid);

        // Get fields of ir.attachment
        const fields = await odoo['request']('object', 'execute_kw', [
            config.odoo_db,
            uid,
            config.odoo_password,
            'ir.attachment',
            'fields_get',
            [['raw', 'db_datas']],
            {}
        ]);

        console.log('raw:', fields.raw);
        console.log('db_datas:', fields.db_datas);
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
