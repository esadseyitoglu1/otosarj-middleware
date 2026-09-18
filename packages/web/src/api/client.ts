/**
 * API client - middleware sunucusuna HMAC imzali istek atar.
 *
 * ONEMLI: Bu, gercek bir operator uygulamasinda GUVENSIZ bir desendir --
 * HMAC secret'i tarayicida tutmak/kullanmak production'da asla yapilmaz
 * (secret istemciye sizar). Gercek entegrasyonda imzalama operatorun
 * KENDI backend'inde yapilir, tarayici sadece o backend'e konusur.
 *
 * Burada demo/simulasyon amacli, kullanicinin "gercek API sozlesmesini
 * gorsun" isteği icin tarayicida imzaliyoruz -- bu bir prototip kisayoludur,
 * bkz. docs/technical/SECURITY.md (Asama 3) "kapsam disi" notu.
 *
 * IKI DEMO OPERATORU / IKI API KEY: Simulator iki sahayi (OtoPriz ve
 * "buyuk operator") gosterdigi icin, gercek coklu-kiracili guvenlik
 * modelini demo'da da BOZMADAN kanitlamak icin saha bazinda farkli
 * API key kullaniyoruz -- server'daki operatorId kontrolu hicbir zaman
 * gevsetilmiyor (bkz. server/src/middleware/auth.ts DEMO_API_KEYS).
 */
import type { Decision, DeclineReason, TriggeredRule } from '@otosarj/engine';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

// Prototip demo secret'i -- gercek dagitimda asla client'a gomulmez.
// server/src/middleware/auth.ts icindeki DEMO_API_KEYS ile eslesir.
const DEMO_HMAC_SECRET = import.meta.env.VITE_DEMO_HMAC_SECRET ?? 'demo-secret-degistir';

// stationId -> API key eslemesi. server/src/fixtures ile senkron tutulmali.
const STATION_API_KEYS: Record<string, string> = {
  'otopriz-taspinar-benzeri': 'demo-otopriz-key',
  'buyuk-operator-ornek': 'demo-large-operator-key',
};
const DEFAULT_API_KEY = 'demo-otopriz-key';

function apiKeyForStation(stationId: string | undefined): string {
  if (!stationId) return DEFAULT_API_KEY;
  return STATION_API_KEYS[stationId] ?? DEFAULT_API_KEY;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function signedFetch(
  method: string,
  path: string,
  body?: unknown,
  stationId?: string
): Promise<Response> {
  const rawBody = body === undefined ? '' : JSON.stringify(body);
  const timestamp = String(Date.now());
  const payload = `${method}\n${path}\n${rawBody}\n${timestamp}`;
  const signature = await hmacSha256Hex(DEMO_HMAC_SECRET, payload);
  const apiKey = apiKeyForStation(stationId);

  return fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Signature': signature,
      'X-Timestamp': timestamp,
    },
    body: body === undefined ? undefined : rawBody,
  });
}

export interface ScanRequest {
  sessionId: string;
  stationId: string;
  scannedEvseId: string;
  vehicleProfileId: string | null;
  currentSocPercent: number;
}

export async function scan(req: ScanRequest): Promise<Decision> {
  const res = await signedFetch('POST', '/api/v1/scan', req, req.stationId);
  if (!res.ok) {
    throw new Error(`scan basarisiz: ${res.status}`);
  }
  return res.json() as Promise<Decision>;
}

export async function getStationLive(stationId: string) {
  const res = await signedFetch(
    'GET',
    `/api/v1/stations/${stationId}/live`,
    undefined,
    stationId
  );
  if (!res.ok) {
    throw new Error(`saha verisi alinamadi: ${res.status}`);
  }
  return res.json();
}

export async function acceptNudge(params: {
  sessionId: string;
  stationId: string;
  evseId: string;
  triggeredRule: TriggeredRule;
}): Promise<void> {
  await signedFetch('POST', '/api/v1/sessions/accept-nudge', params, params.stationId);
}

export async function declineNudge(params: {
  sessionId: string;
  stationId: string;
  evseId: string;
  triggeredRule: TriggeredRule;
  declineReason?: DeclineReason;
}): Promise<void> {
  await signedFetch('POST', '/api/v1/sessions/decline-nudge', params, params.stationId);
}

export async function simulateStartSession(params: {
  stationId: string;
  evseId: string;
  liveDrawKw: number;
}): Promise<void> {
  await signedFetch('POST', '/api/v1/simulate/start-session', params, params.stationId);
}

export async function simulateReset(): Promise<void> {
  // Reset tum sahalari etkiler (mock CSMS), herhangi bir gecerli key yeterli.
  await signedFetch('POST', '/api/v1/simulate/reset');
}
