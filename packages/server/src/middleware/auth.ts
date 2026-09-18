/**
 * API kimlik dogrulama - HMAC imza kontrolu.
 *
 * GUVENLIK KARARI (plan G3): Operator-middleware arasi istek HMAC ile
 * imzalanir. Prototipte API key + HMAC ile gosterilir; gercek dagitimda
 * mTLS onerilir (bkz. .ai/KNOWN_ISSUES.md - bu prototipte simule edilmistir,
 * gercek sertifika yonetimi yoktur).
 *
 * Imza semasi: HMAC-SHA256(secret, `${method}\n${path}\n${bodyRawJson}\n${timestamp}`)
 * Header'lar: X-Api-Key, X-Signature, X-Timestamp
 *
 * Zaman damgasi kontrolu replay saldirisina karsi bir dakikalik pencere sunar.
 */
import type { NextFunction, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

const TIMESTAMP_TOLERANCE_MS = 60_000; // 1 dakika

export interface ApiKeyStore {
  [apiKey: string]: { secret: string; operatorId: string };
}

// Prototip amacli in-memory key store. Gercek dagitimda bu bir secret
// manager'dan (env, vault vb.) gelmeli, her operator kendi key/secret
// ciftini alir.
//
// Simulatorde iki saha (OtoPriz ve "buyuk operator") gosterildigi icin
// iki demo key var -- bu, urunun operator-agnostik oldugunu (ayni
// middleware, farkli operatorlere ayri yetkilerle hizmet verebiliyor)
// production'da da dogru sekilde kanitliyor: web client saha
// degistirince farkli bir API key ile imzaliyor (bkz. api/client.ts),
// guvenlik kontrolu (operatorId eslesmesi) hicbir zaman gevsetilmiyor.
export const DEMO_API_KEYS: ApiKeyStore = {
  'demo-otopriz-key': {
    secret: process.env.OTOSARJ_DEMO_HMAC_SECRET ?? 'demo-secret-degistir',
    operatorId: 'otopriz',
  },
  'demo-large-operator-key': {
    secret: process.env.OTOSARJ_DEMO_HMAC_SECRET ?? 'demo-secret-degistir',
    operatorId: 'buyuk-operator',
  },
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      operatorId?: string;
    }
  }
}

function computeSignature(
  secret: string,
  method: string,
  path: string,
  rawBody: string,
  timestamp: string
): string {
  const payload = `${method}\n${path}\n${rawBody}\n${timestamp}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * ONEMLI (Guvenlik G3, enumeration korumasi): dogrulama basarisiz oldugunda
 * HER ZAMAN ayni jenerik hatayi doner -- "soket bulunamadi" / "gecersiz
 * imza" gibi ayrimlar sizdirilmaz. Boylece bir saldirgan hangi API key'in
 * gecerli, hangi soketin var oldugunu deneme-yanilma ile cikaramaz.
 */
export function requireSignedRequest(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-Api-Key');
  const signature = req.header('X-Signature');
  const timestamp = req.header('X-Timestamp');

  if (!apiKey || !signature || !timestamp) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const keyEntry = DEMO_API_KEYS[apiKey];
  if (!keyEntry) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const tsNumber = Number(timestamp);
  if (!Number.isFinite(tsNumber) || Math.abs(Date.now() - tsNumber) > TIMESTAMP_TOLERANCE_MS) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  // req.rawBody, express.json() verify hook'unda dolduruluyor (bkz. app.ts)
  const rawBody = req.rawBody ?? '';
  const expected = computeSignature(
    keyEntry.secret,
    req.method,
    req.originalUrl,
    rawBody,
    timestamp
  );

  if (!safeCompare(expected, signature)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  req.operatorId = keyEntry.operatorId;
  next();
}

declare module 'express-serve-static-core' {
  interface Request {
    rawBody?: string;
  }
}
