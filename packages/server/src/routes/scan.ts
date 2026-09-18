/**
 * POST /api/v1/scan - ANA ENDPOINT.
 * Operatorun QR-okutma akisina takilacak tek cagri. Bu ucnoktanin
 * sozlesmesi = satis argumani (bkz. README, plan Adim 1.4).
 */
import type { Request, Response } from 'express';
import { decide, findVehicleById, type ScanInput } from '@otosarj/engine';
import type { CsmsAdapter } from '../adapters/csms/CsmsAdapter.js';
import type { SuppressionStore } from '../suppressionStore.js';
import type { TelemetryStore } from '../telemetryStore.js';
import type { ScanRequestBody } from '../middleware/validate.js';

export function createScanHandler(
  csms: CsmsAdapter,
  suppression: SuppressionStore,
  telemetry: TelemetryStore
) {
  return async function scanHandler(req: Request, res: Response): Promise<void> {
    const body = req.body as ScanRequestBody;

    const station = await csms.getStation(body.stationId);
    if (!station) {
      // Jenerik hata -- enumeration korumasi (Guvenlik G3): "boyle saha yok"
      // demiyoruz, gecersiz istek diyoruz.
      res.status(400).json({ error: 'invalid_request' });
      return;
    }

    // Yetki kontrolu: bu API key sadece kendi operatorunun sahasini sorgulayabilir.
    if (station.operatorId !== req.operatorId) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }

    const vehicle = body.vehicleProfileId ? findVehicleById(body.vehicleProfileId) : null;

    const input: ScanInput = {
      sessionId: body.sessionId,
      stationId: body.stationId,
      scannedEvseId: body.scannedEvseId,
      vehicleProfileId: body.vehicleProfileId,
      currentSocPercent: body.currentSocPercent,
    };

    const decision = decide({
      input,
      station,
      vehicle,
      suppressionHistory: suppression.getHistory(),
    });

    if (decision.verdict === 'NUDGE' && decision.triggeredRule) {
      telemetry.recordNudgeShown(body.stationId, decision.triggeredRule);
    }

    res.status(200).json(decision);
  };
}
