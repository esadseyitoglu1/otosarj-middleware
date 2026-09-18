/**
 * Test yardimcisi -- HMAC imzali istek olusturur. Sadece test dosyalarinda
 * kullanilir, production kodunda import edilmez.
 */
import { createHmac } from 'node:crypto';
import { DEMO_API_KEYS } from './middleware/auth.js';

export const TEST_API_KEY = 'demo-otopriz-key';

export function signRequest(method: string, path: string, body: unknown) {
  const keyEntry = DEMO_API_KEYS[TEST_API_KEY];
  if (!keyEntry) throw new Error('test api key missing');
  const rawBody = body === undefined ? '' : JSON.stringify(body);
  const timestamp = String(Date.now());
  const payload = `${method}\n${path}\n${rawBody}\n${timestamp}`;
  const signature = createHmac('sha256', keyEntry.secret).update(payload).digest('hex');
  return {
    headers: {
      'X-Api-Key': TEST_API_KEY,
      'X-Signature': signature,
      'X-Timestamp': timestamp,
    },
    rawBody,
  };
}
