import { NextRequest, NextResponse } from 'next/server';
import { requireSession, getIntegrationSettings, saveIntegrationSettings } from '@/lib/bank/product-store';

export async function GET(req: NextRequest) {
  const session = await requireSession(req, ['Admin']);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const integration = await getIntegrationSettings();
  return NextResponse.json({ integration });
}

export async function PUT(req: NextRequest) {
  const session = await requireSession(req, ['Admin']);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = await saveIntegrationSettings(session.user, {
    middlewareBaseUrl: body.middlewareBaseUrl || '',
    middlewareApiKey: body.middlewareApiKey || '',
    middlewareBankName: body.middlewareBankName || '',
  });
  if (!result.success) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  return NextResponse.json(result);
}
