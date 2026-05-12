import crypto from 'crypto';

export async function verifyWebhookSignature(
  body: string,
  signatureHeader: string,
  clientSecret: string
) {
  const hmac = crypto.createHmac('sha256', clientSecret).update(body).digest('base64');
  return hmac === signatureHeader;
}
