/**
 * POST /api/v1/simulate/start-session
 * DEMO AMACLI -- gercek bir CSMS'te bulunmaz. Simulator arayuzunun
 * senaryo butonlarinin ("1A'da sarj baslat" vb.) sahadaki durumu
 * degistirebilmesi icin var. MockCsmsAdapter'in _sim* metodlarini kullanir.
 *
 * GUVENLIK DUZELTMESI (bkz. guvenlik incelemesi): start-session daha once
 * stationId'nin cagiran operatore ait olup olmadigini kontrol etmiyordu --
 * gecerli herhangi bir demo API key ile BASKA operatorun sahasindaki EVSE
 * durumu degistirilebiliyordu. Demo/simulasyon ucnoktasi olsa da, ayni
 * operatorId izolasyonu /scan ve /live ile tutarli olacak sekilde eklendi.
 */
import type { Request, Response } from 'express';
import type { MockCsmsAdapter } from '../adapters/csms/MockCsmsAdapter.js';

interface SimulateStartBody {
  stationId: string;
  evseId: string;
  liveDrawKw: number;
}

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function isValidBody(body: unknown): body is SimulateStartBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.stationId === 'string' &&
    ID_PATTERN.test(b.stationId) &&
    typeof b.evseId === 'string' &&
    ID_PATTERN.test(b.evseId) &&
    typeof b.liveDrawKw === 'number' &&
    Number.isFinite(b.liveDrawKw) &&
    b.liveDrawKw >= 0
  );
}

export function createSimulateStartHandler(csms: MockCsmsAdapter) {
  return async function simulateStartHandler(req: Request, res: Response): Promise<void> {
    if (!isValidBody(req.body)) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const station = await csms.getStation(req.body.stationId);
    if (!station || station.operatorId !== req.operatorId) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const ok = csms._simSetEvseStatus(
      req.body.stationId,
      req.body.evseId,
      'charging',
      req.body.liveDrawKw
    );
    if (!ok) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(200).json({ ok: true });
  };
}

export function createSimulateResetHandler(csms: MockCsmsAdapter) {
  return function simulateResetHandler(_req: Request, res: Response): void {
    csms._simReset();
    res.status(200).json({ ok: true });
  };
}
