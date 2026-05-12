import { useApp } from '@/context/AppContext';

export async function setQuickbooksTokens(payload: {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  realmId?: string;
}) {
  const {
    setQbAccessToken,
    setQbRefreshToken,
    setQbTokenExpiresAt,
    setQbRealmId,
    setQbConnected,
  } = useApp();

  setQbAccessToken(payload.accessToken);
  setQbRefreshToken(payload.refreshToken);
  setQbTokenExpiresAt(payload.tokenExpiresAt);
  if (payload.realmId) setQbRealmId(payload.realmId);
  setQbConnected(true);
}

/** Guarantees a valid access token, refreshing automatically if needed */
export async function getQuickbooksAccessToken(): Promise<string> {
  const {
    qbClientId,
    qbClientSecret,
    qbAccessToken,
    qbRefreshToken,
    qbTokenExpiresAt,
    setQbAccessToken,
    setQbRefreshToken,
    setQbTokenExpiresAt,
    setQbConnected,
  } = useApp();

  if (!qbClientId || !qbClientSecret) {
    throw new Error('QuickBooks not configured');
  }
  
  // Refresh when <2 min left
  if (qbTokenExpiresAt && qbTokenExpiresAt - Date.now() < 2 * 60 * 1000) {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: qbRefreshToken,
    });

    const resp = await fetch(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' + Buffer.from(`${qbClientId}:${qbClientSecret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!resp.ok) {
      setQbConnected(false);
      throw new Error('QuickBooks token refresh failed');
    }

    const data = await resp.json();
    setQbAccessToken(data.access_token);
    setQbRefreshToken(data.refresh_token);
    setQbTokenExpiresAt(Date.now() + data.expires_in * 1000);
    return data.access_token;
  }
  return qbAccessToken;
}
