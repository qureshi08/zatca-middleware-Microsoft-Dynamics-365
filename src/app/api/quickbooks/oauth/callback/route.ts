import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || state !== 'quickbooks_oauth') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Note: Since AppContext is client-side, we can't easily update it from a server route
  // unless we use session cookies or redirect back with tokens in the URL (not secure)
  // or use a temporary landing page that handles the update client-side.
  
  // We'll redirect to a landing page that will capture the code and perform the final exchange client-side,
  // or redirect back to settings with the code so the client-side can finish the job.
  
  return NextResponse.redirect(new URL(`/admin/quickbooks/settings?code=${code}`, req.url));
}
