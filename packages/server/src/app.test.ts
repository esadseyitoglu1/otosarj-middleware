import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { signRequest, TEST_LARGE_OPERATOR_API_KEY } from './testUtils.js';

describe('POST /api/v1/scan - guvenlik', () => {
  it('imzasiz istek 401 doner, Decision donmemeli', async () => {
    const app = createApp();
    const res = await request(app).post('/api/v1/scan').send({
      sessionId: 'session-abc12345',
      stationId: 'otopriz-taspinar-benzeri',
      scannedEvseId: '1B',
      vehicleProfileId: null,
      currentSocPercent: 20,
    });

    expect(res.status).toBe(401);
    expect(res.body.verdict).toBeUndefined();
  });

  it('yanlis imza 401 doner', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/v1/scan')
      .set('X-Api-Key', 'demo-otopriz-key')
      .set('X-Signature', 'gecersiz-imza')
      .set('X-Timestamp', String(Date.now()))
      .send({
        sessionId: 'session-abc12345',
        stationId: 'otopriz-taspinar-benzeri',
        scannedEvseId: '1B',
        vehicleProfileId: null,
        currentSocPercent: 20,
      });

    expect(res.status).toBe(401);
  });

  it('gecerli imza + gecerli govde ile 200 ve Decision doner', async () => {
    const app = createApp();
    const body = {
      sessionId: 'session-abc12345',
      stationId: 'otopriz-taspinar-benzeri',
      scannedEvseId: '1B',
      vehicleProfileId: 'togg-t10x-rwd',
      currentSocPercent: 20,
    };
    const { headers } = signRequest('POST', '/api/v1/scan', body);

    const res = await request(app)
      .post('/api/v1/scan')
      .set(headers)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe('NUDGE');
    expect(res.body.triggeredRule).toBe('R1');
  });

  it('bilinmeyen evseId icin jenerik hata doner, topoloji sizdirmaz', async () => {
    const app = createApp();
    const body = {
      sessionId: 'session-abc12345',
      stationId: 'otopriz-taspinar-benzeri',
      scannedEvseId: '../../../etc/passwd', // ID_PATTERN'i ihlal eder
      vehicleProfileId: null,
      currentSocPercent: 20,
    };
    const { headers } = signRequest('POST', '/api/v1/scan', body);

    const res = await request(app).post('/api/v1/scan').set(headers).send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_request' });
  });

  it('currentSocPercent aralik disi ise 400 doner', async () => {
    const app = createApp();
    const body = {
      sessionId: 'session-abc12345',
      stationId: 'otopriz-taspinar-benzeri',
      scannedEvseId: '1B',
      vehicleProfileId: null,
      currentSocPercent: 150,
    };
    const { headers } = signRequest('POST', '/api/v1/scan', body);

    const res = await request(app).post('/api/v1/scan').set(headers).send(body);
    expect(res.status).toBe(400);
  });

  it('donen Decision govdesinde plaka/VIN/ham kisisel veri alani yok', async () => {
    const app = createApp();
    const body = {
      sessionId: 'session-abc12345',
      stationId: 'otopriz-taspinar-benzeri',
      scannedEvseId: '1B',
      vehicleProfileId: 'togg-t10x-rwd',
      currentSocPercent: 20,
    };
    const { headers } = signRequest('POST', '/api/v1/scan', body);

    const res = await request(app).post('/api/v1/scan').set(headers).send(body);

    const serialized = JSON.stringify(res.body).toLowerCase();
    expect(serialized).not.toMatch(/plaka|vin|plate|licens/);
    expect(res.body.sessionId).toBeUndefined();
  });
});

describe('GET /api/v1/stations/:id/live - guvenlik', () => {
  it('imzasiz istek 401 doner (rakip istihbarati engeli)', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/stations/otopriz-taspinar-benzeri/live');
    expect(res.status).toBe(401);
  });

  it('gecerli imza ile kendi sahasini gorebilir', async () => {
    const app = createApp();
    const { headers } = signRequest('GET', '/api/v1/stations/otopriz-taspinar-benzeri/live', undefined);
    const res = await request(app)
      .get('/api/v1/stations/otopriz-taspinar-benzeri/live')
      .set(headers);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('otopriz-taspinar-benzeri');
  });

  it('baska operatorun sahasini goremez (404, varligini bile sizdirmaz)', async () => {
    const app = createApp();
    const { headers } = signRequest('GET', '/api/v1/stations/buyuk-operator-ornek/live', undefined);
    const res = await request(app)
      .get('/api/v1/stations/buyuk-operator-ornek/live')
      .set(headers);
    expect(res.status).toBe(404);
  });

  it('buyuk operator kendi key\'iyle kendi sahasini gorebilir', async () => {
    const app = createApp();
    const { headers } = signRequest(
      'GET',
      '/api/v1/stations/buyuk-operator-ornek/live',
      undefined,
      TEST_LARGE_OPERATOR_API_KEY
    );
    const res = await request(app)
      .get('/api/v1/stations/buyuk-operator-ornek/live')
      .set(headers);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('buyuk-operator-ornek');
  });
});

describe('senaryo B - buyuk operator sahasinda R2 uctan uca', () => {
  it('dogru API key ile PHEV + 300kW soket taramasi NUDGE doner (regresyon: web UI\'da saha degisince 400/404 hatasi vermemeli)', async () => {
    const app = createApp();
    const body = {
      sessionId: 'session-large-op-e2e',
      stationId: 'buyuk-operator-ornek',
      scannedEvseId: 'ultra-1',
      vehicleProfileId: 'toyota-prius-phev',
      currentSocPercent: 20,
    };
    const { headers } = signRequest('POST', '/api/v1/scan', body, TEST_LARGE_OPERATOR_API_KEY);

    const res = await request(app).post('/api/v1/scan').set(headers).send(body);

    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe('NUDGE');
    expect(res.body.triggeredRule).toBe('R2');
  });

  it('OtoPriz key\'iyle buyuk operator sahasi taranirsa 400 doner (yetki izolasyonu korunuyor)', async () => {
    const app = createApp();
    const body = {
      sessionId: 'session-cross-tenant',
      stationId: 'buyuk-operator-ornek',
      scannedEvseId: 'ultra-1',
      vehicleProfileId: 'toyota-prius-phev',
      currentSocPercent: 20,
    };
    const { headers } = signRequest('POST', '/api/v1/scan', body);

    const res = await request(app).post('/api/v1/scan').set(headers).send(body);

    expect(res.status).toBe(400);
  });
});

describe('rate limiting', () => {
  it('limit asilinca 429 doner', async () => {
    const app = createApp();
    const { headers } = signRequest('GET', '/api/v1/stations/otopriz-taspinar-benzeri/live', undefined);

    let lastStatus = 200;
    for (let i = 0; i < 65; i++) {
      const res = await request(app)
        .get('/api/v1/stations/otopriz-taspinar-benzeri/live')
        .set(headers);
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});

describe('R5 suppression uctan uca', () => {
  it('reddedilen uyari tekrar okutulunca sessiz gecer', async () => {
    const app = createApp();
    const scanBody = {
      sessionId: 'session-suppress01',
      stationId: 'otopriz-taspinar-benzeri',
      scannedEvseId: '1B',
      vehicleProfileId: 'togg-t10x-rwd',
      currentSocPercent: 20,
    };

    const scanReq1 = signRequest('POST', '/api/v1/scan', scanBody);
    const first = await request(app).post('/api/v1/scan').set(scanReq1.headers).send(scanBody);
    expect(first.body.verdict).toBe('NUDGE');

    const declineBody = {
      sessionId: 'session-suppress01',
      stationId: 'otopriz-taspinar-benzeri',
      evseId: '1B',
      triggeredRule: 'R1',
    };
    const declineReq = signRequest('POST', '/api/v1/sessions/decline-nudge', declineBody);
    await request(app)
      .post('/api/v1/sessions/decline-nudge')
      .set(declineReq.headers)
      .send(declineBody);

    const scanReq2 = signRequest('POST', '/api/v1/scan', scanBody);
    const second = await request(app).post('/api/v1/scan').set(scanReq2.headers).send(scanBody);
    expect(second.body.verdict).toBe('PROCEED');
  });
});

describe('fail-safe (G5)', () => {
  it('gecersiz JSON govde crash etmez, kontrollu hata doner', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/v1/scan')
      .set('Content-Type', 'application/json')
      .set('X-Api-Key', 'demo-otopriz-key')
      .set('X-Signature', 'x')
      .set('X-Timestamp', String(Date.now()))
      .send('{gecersiz-json');

    expect([400, 401, 500]).toContain(res.status);
  });
});
