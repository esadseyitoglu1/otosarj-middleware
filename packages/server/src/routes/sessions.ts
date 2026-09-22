/**
 * POST /api/v1/sessions/accept-nudge ve /decline-nudge.
 * Surucunun oneriye verdigi tepkiyi kaydeder -- ROI modelinin (Asama 2)
 * girdisi olan kabul/red oranini ve red-sebebi dagilimini besler.
 *
 * GUVENLIK DUZELTMESI (bkz. guvenlik incelemesi): bu iki ucnokta daha once
 * stationId'nin cagiran operatore ait olup olmadigini KONTROL ETMIYORDU --
 * gecerli herhangi bir API key ile baska bir operatorun sahasina telemetri/
 * suppression kaydi yazilabiliyordu (cross-tenant yazma). /scan ve /live
 * ucnoktalarindaki gibi operatorId eslesmesi burada da zorunlu kilindi.
 */
import type { Request, Response } from 'express';
import type { DeclineReason, TriggeredRule } from '@otosarj/engine';
import type { CsmsAdapter } from '../adapters/csms/CsmsAdapter.js';
import type { SuppressionStore } from '../suppressionStore.js';
import type { TelemetryStore } from '../telemetryStore.js';

interface NudgeResponseBody {
  sessionId: string;
  stationId: string;
  evseId: string;
  triggeredRule: TriggeredRule;
  declineReason?: DeclineReason;
}

const VALID_RULES: ReadonlyArray<TriggeredRule> = ['R1', 'R2', 'R3', 'R5'];
const VALID_REASONS: ReadonlyArray<DeclineReason> = ['parking', 'price', 'short-stop', 'other'];
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function isValidNudgeBody(body: unknown): body is NudgeResponseBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.sessionId !== 'string' || !SESSION_ID_PATTERN.test(b.sessionId)) return false;
  if (typeof b.stationId !== 'string' || !ID_PATTERN.test(b.stationId)) return false;
  if (typeof b.evseId !== 'string' || !ID_PATTERN.test(b.evseId)) return false;
  if (!VALID_RULES.includes(b.triggeredRule as TriggeredRule)) return false;
  if (b.declineReason !== undefined && !VALID_REASONS.includes(b.declineReason as DeclineReason)) {
    return false;
  }
  return true;
}

async function isOwnStation(
  csms: CsmsAdapter,
  stationId: string,
  operatorId: string | undefined
): Promise<boolean> {
  const station = await csms.getStation(stationId);
  return station !== null && station.operatorId === operatorId;
}

export function createAcceptNudgeHandler(telemetry: TelemetryStore, csms: CsmsAdapter) {
  return async function acceptNudgeHandler(req: Request, res: Response): Promise<void> {
    if (!isValidNudgeBody(req.body)) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    if (!(await isOwnStation(csms, req.body.stationId, req.operatorId))) {
      // Jenerik hata -- enumeration korumasi, /scan ile tutarli.
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    telemetry.recordAccept(req.body.stationId);
    res.status(200).json({ ok: true });
  };
}

export function createDeclineNudgeHandler(
  suppression: SuppressionStore,
  telemetry: TelemetryStore,
  csms: CsmsAdapter
) {
  return async function declineNudgeHandler(req: Request, res: Response): Promise<void> {
    if (!isValidNudgeBody(req.body)) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const { sessionId, stationId, evseId, triggeredRule, declineReason } = req.body;
    if (!(await isOwnStation(csms, stationId, req.operatorId))) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    suppression.recordDecline(sessionId, stationId, evseId, triggeredRule);
    telemetry.recordDecline(stationId, declineReason);
    res.status(200).json({ ok: true });
  };
}
