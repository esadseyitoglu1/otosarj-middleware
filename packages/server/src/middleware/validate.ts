/**
 * Input validation - tip + aralik kontrolu.
 *
 * GUVENLIK KARARI (plan G3): tum govde alanlari sunucu tarafinda dogrulanir.
 * Gecersiz istekler jenerik 400 doner -- hangi alanin neden gecersiz
 * oldugu asiri detayli sizdirilmaz (enumeration/probing riskini azaltir).
 */
import type { NextFunction, Request, Response } from 'express';

export interface ScanRequestBody {
  sessionId: string;
  stationId: string;
  scannedEvseId: string;
  vehicleProfileId: string | null;
  currentSocPercent: number;
}

const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function isValidScanBody(body: unknown): body is ScanRequestBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;

  if (typeof b.sessionId !== 'string' || !SESSION_ID_PATTERN.test(b.sessionId)) {
    return false;
  }
  if (typeof b.stationId !== 'string' || !ID_PATTERN.test(b.stationId)) {
    return false;
  }
  if (typeof b.scannedEvseId !== 'string' || !ID_PATTERN.test(b.scannedEvseId)) {
    return false;
  }
  if (b.vehicleProfileId !== null && typeof b.vehicleProfileId !== 'string') {
    return false;
  }
  if (b.vehicleProfileId !== null && !ID_PATTERN.test(b.vehicleProfileId)) {
    return false;
  }
  if (
    typeof b.currentSocPercent !== 'number' ||
    !Number.isFinite(b.currentSocPercent) ||
    b.currentSocPercent < 0 ||
    b.currentSocPercent > 100
  ) {
    return false;
  }

  return true;
}

export function validateScanRequest(req: Request, res: Response, next: NextFunction): void {
  if (!isValidScanBody(req.body)) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }
  next();
}

export function validateStationIdParam(req: Request, res: Response, next: NextFunction): void {
  const id = req.params.id;
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }
  next();
}
