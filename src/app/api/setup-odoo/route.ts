import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const URL = 'https://convergentbt.odoo.com';
const DB = 'convergentbt';
const USERNAME = 'muhammad.anas.quershi@convergentbt.com';
const PASSWORD = '-A,9*G%q7U6xX*W';

async function request(service: string, method: string, args: any[], kwargs = {}) {
    const res = await fetch(`${URL}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: { service, method, args, kwargs },
            id: 1,
        }),
    });
    const json = await res.json();
    if (json.error) throw new Error(JSON.stringify(json.error));
    return json.result;
}

export async function GET(req: Request) {
    let logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };

    try {
        const { searchParams } = new URL(req.url);
        const tunnelUrl = searchParams.get('url');
        
        if (!tunnelUrl) {
            log("Error: No tunnel URL provided. Pass it in the query string: ?url=https://xyz.loca.lt");
            return new Response("LOGS:\n" + logs.join("\n"), { headers: { 'Content-Type': 'text/plain' } });
        }

        log("1. Authenticating to Odoo...");
        const uid = await request('common', 'authenticate', [DB, USERNAME, PASSWORD, {}]);
        log(`Authenticated. UID: ${uid}`);

        // Strip trailing slash from URL if present
        const cleanTunnelUrl = tunnelUrl.endsWith('/') ? tunnelUrl.slice(0, -1) : tunnelUrl;
        const newWebhookUrl = `${cleanTunnelUrl}/api/odoo/webhook?apiKey=sk_zatca_live_0839a12bc5ee45a8ba854bf7b47a08fd`;
        
        log(`2. Updating Server Action 469 URL to: ${newWebhookUrl}...`);
        await request('object', 'execute_kw', [DB, uid, PASSWORD, 'ir.actions.server', 'write', [[469], { 
            webhook_url: newWebhookUrl 
        }]]);
        log("Successfully updated Odoo Server Action URL.");

        log("3. Re-triggering Server Action for Invoice INV/2026/00003 (ID 3)...");
        await request('object', 'execute_kw', [DB, uid, PASSWORD, 'ir.actions.server', 'run', [[469]], { context: { active_model: 'account.move', active_ids: [3] } }]);
        log("Webhook trigger request sent to Odoo.");

        log("4. Waiting 4 seconds for webhook delivery...");
        await new Promise(r => setTimeout(r, 4000));

        log("5. Checking invoice status in Odoo database...");
        const moves = await request('object', 'execute_kw', [DB, uid, PASSWORD, 'account.move', 'search_read', [[['name', '=', 'INV/2026/00003']]], { fields: ['id', 'name', 'state', 'x_zatca_status', 'x_zatca_error', 'x_zatca_uuid'] }]);
        if (moves.length > 0) {
            const move = moves[0];
            log(`Invoice ID ${move.id} status is now: ${move.x_zatca_status}`);
            log(`x_zatca_uuid: ${move.x_zatca_uuid}`);
            log(`x_zatca_error: ${move.x_zatca_error}`);
        } else {
            log("Invoice INV/2026/00003 not found.");
        }

        return new Response("LOGS:\n" + logs.join("\n"), {
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (e: any) {
        log("Outer Error: " + e.message);
        return new Response("ERROR:\n" + logs.join("\n"), {
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}
