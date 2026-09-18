/**
 * POST /api/v1/simulate/start-session
 * DEMO AMACLI -- gercek bir CSMS'te bulunmaz. Simulator arayuzunun
 * senaryo butonlarinin ("1A'da sarj baslat" vb.) sahadaki durumu
 * degistirebilmesi icin var. MockCsmsAdapter'in _sim* metodlarini kullanir.
 */
import type { Request, Response } from 'express';
import type { MockCsmsAdapter } from '../adapters/csms/MockCsmsAdapter.js';

interface SimulateStartBody {
  stationId: string;
  evseId: string;
  liveDrawKw: number;
}

function isValidBody(body: unknown): body is SimulateStartBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.stationId === 'string' &&
    typeof b.evseId === 'string' &&
    typeof b.liveDrawKw === 'number' &&
    Number.isFinite(b.liveDrawKw)
  );
}

export function createSimulateStartHandler(csms: MockCsmsAdapter) {
  return function simulateStartHandler(req: Request, res: Response): void {
    if (!isValidBody(req.body)) {
      res.status(400).json({ error: 'invalid_request' });
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
