/**
 * POST /api/v1/sessions/accept-nudge ve /decline-nudge.
 * Surucunun oneriye verdigi tepkiyi kaydeder -- ROI modelinin (Asama 2)
 * girdisi olan kabul/red oranini ve red-sebebi dagilimini besler.
 */
import type { Request, Response } from 'express';
import type { DeclineReason, TriggeredRule } from '@otosarj/engine';
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

function isValidNudgeBody(body: unknown): body is NudgeResponseBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.sessionId !== 'string' || typeof b.stationId !== 'string') return false;
  if (typeof b.evseId !== 'string') return false;
  if (!VALID_RULES.includes(b.triggeredRule as TriggeredRule)) return false;
  if (b.declineReason !== undefined && !VALID_REASONS.includes(b.declineReason as DeclineReason)) {
    return false;
  }
  return true;
}

export function createAcceptNudgeHandler(telemetry: TelemetryStore) {
  return function acceptNudgeHandler(req: Request, res: Response): void {
    if (!isValidNudgeBody(req.body)) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    telemetry.recordAccept(req.body.stationId);
    res.status(200).json({ ok: true });
  };
}

export function createDeclineNudgeHandler(
  suppression: SuppressionStore,
  telemetry: TelemetryStore
) {
  return function declineNudgeHandler(req: Request, res: Response): void {
    if (!isValidNudgeBody(req.body)) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const { sessionId, stationId, evseId, triggeredRule, declineReason } = req.body;
    suppression.recordDecline(sessionId, stationId, evseId, triggeredRule);
    telemetry.recordDecline(stationId, declineReason);
    res.status(200).json({ ok: true });
  };
}
