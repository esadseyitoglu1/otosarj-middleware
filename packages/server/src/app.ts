/**
 * Express uygulama kurulumu.
 *
 * GUVENLIK KARARI G5 (Fail-safe, bkz. plan "Guvenlik & Mahremiyet"):
 * Bu dosyanin sonundaki global error handler, motor veya herhangi bir
 * route beklenmedik sekilde hata firlatirsa exception'in disariya
 * sizmasini engeller ve jenerik bir hata doner. Operatorun QR akisi
 * middleware'in cevap vermemesi/hata donmesi durumunda TIMEOUT ile
 * normal akisa devam etmelidir (bu davranis operator tarafinda,
 * middleware'in sorumlulugu degil -- ama biz kendi tarafimizda asla
 * cip cikarmayarak/crash olmayarak "PROCEED" sonucuna esdeger bir
 * guvenli hata donduruyoruz).
 */
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requireSignedRequest } from './middleware/auth.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { validateScanRequest, validateStationIdParam } from './middleware/validate.js';
import { MockCsmsAdapter } from './adapters/csms/MockCsmsAdapter.js';
import { SuppressionStore } from './suppressionStore.js';
import { TelemetryStore } from './telemetryStore.js';
import { createScanHandler } from './routes/scan.js';
import { createStationLiveHandler } from './routes/stations.js';
import { createAcceptNudgeHandler, createDeclineNudgeHandler } from './routes/sessions.js';
import { createSimulateStartHandler, createSimulateResetHandler } from './routes/simulate.js';

// GUVENLIK KARARI (bkz. guvenlik incelemesi): CORS onceden `cors()` ile
// sinirsizdi (Access-Control-Allow-Origin: *). Bu API HMAC imzasi
// gerektirdigi icin CSRF/credential hirsizligi riski dusuktu (bkz. auth.ts),
// ama "hangi origin'ler bu API'yi tarayicidan cagirabilir" sorusu acikca
// tanimli degildi. Artik izinli origin listesi CORS_ALLOWED_ORIGINS env
// degiskeninden (virgulle ayrilmis) okunuyor; tanimli degilse gelistirme
// icin localhost'a dusuluyor -- production'da bu deger mutlaka set edilmeli.
function resolveAllowedOrigins(): (string | RegExp)[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (raw && raw.trim().length > 0) {
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
  }
  // Vite varsayilan portu mesgulse kendiliginden bir sonrakine kayar
  // (5173 -> 5174 -> ...), bu yuzden dev fallback'i tek porta baglamiyoruz.
  return [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
}

export function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1);

  // GUVENLIK: HTTP guvenlik header'lari (CSP, X-Frame-Options,
  // X-Content-Type-Options, HSTS vb.). Bu API JSON dondugu ve tarayicida
  // dogrudan render edilen HTML sunmadigi icin varsayilan Helmet CSP
  // yeterli -- ayrica statik sayfa yok ki inline script/style istisnasi
  // gereksin.
  app.use(helmet());

  const allowedOrigins = resolveAllowedOrigins();
  app.use(
    cors({
      origin: allowedOrigins,
    })
  );

  // JSON body parse ederken RAW govdeyi de sakla -- HMAC imza kontrolu
  // (auth.ts) imzali metnin tam olarak istemcinin gonderdigi byte'lar
  // uzerinden hesaplanmasini gerektirir.
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request).rawBody = buf.toString('utf8');
      },
    })
  );

  const csms = new MockCsmsAdapter();
  const suppression = new SuppressionStore();
  const telemetry = new TelemetryStore();

  const scanLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });
  const liveLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.post(
    '/api/v1/scan',
    scanLimiter,
    requireSignedRequest,
    validateScanRequest,
    createScanHandler(csms, suppression, telemetry)
  );

  app.get(
    '/api/v1/stations/:id/live',
    liveLimiter,
    requireSignedRequest,
    validateStationIdParam,
    createStationLiveHandler(csms)
  );

  app.post(
    '/api/v1/sessions/accept-nudge',
    requireSignedRequest,
    createAcceptNudgeHandler(telemetry, csms)
  );

  app.post(
    '/api/v1/sessions/decline-nudge',
    requireSignedRequest,
    createDeclineNudgeHandler(suppression, telemetry, csms)
  );

  // --- Demo/simulasyon ucnoktalari (gercek CSMS'te bulunmaz) ---
  app.post('/api/v1/simulate/start-session', requireSignedRequest, createSimulateStartHandler(csms));
  app.post('/api/v1/simulate/reset', requireSignedRequest, createSimulateResetHandler(csms));

  // GUVENLIK G5 - fail-safe: hicbir route hatasi ciplak exception olarak
  // istemciye sizmaz.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error('[otosarj] beklenmeyen hata:', err);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
