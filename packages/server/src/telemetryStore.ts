/**
 * Telemetri - AGREGE saklanir, kisisel veri icermez (plan G2).
 * "Bu sahada bugun 12 uyari, 7 kabul" -- kim oldugu degil.
 *
 * declineReason dagilimi ROI modelinin (Asama 2) girdisi ve operatore
 * saha icgorusu saglayan yan cikti (plan "Yanlis-Pozitif Riski", madde d).
 */
import type { DeclineReason, TriggeredRule } from '@otosarj/engine';

interface StationTelemetry {
  nudgesShown: number;
  nudgesAccepted: number;
  nudgesDeclined: number;
  declineReasons: Record<DeclineReason, number>;
  byRule: Partial<Record<Exclude<TriggeredRule, null>, number>>;
}

function emptyTelemetry(): StationTelemetry {
  return {
    nudgesShown: 0,
    nudgesAccepted: 0,
    nudgesDeclined: 0,
    declineReasons: { parking: 0, price: 0, 'short-stop': 0, other: 0 },
    byRule: {},
  };
}

export class TelemetryStore {
  private readonly byStation = new Map<string, StationTelemetry>();

  private getOrCreate(stationId: string): StationTelemetry {
    let t = this.byStation.get(stationId);
    if (!t) {
      t = emptyTelemetry();
      this.byStation.set(stationId, t);
    }
    return t;
  }

  recordNudgeShown(stationId: string, rule: Exclude<TriggeredRule, null>): void {
    const t = this.getOrCreate(stationId);
    t.nudgesShown += 1;
    t.byRule[rule] = (t.byRule[rule] ?? 0) + 1;
  }

  recordAccept(stationId: string): void {
    this.getOrCreate(stationId).nudgesAccepted += 1;
  }

  recordDecline(stationId: string, reason: DeclineReason | undefined): void {
    const t = this.getOrCreate(stationId);
    t.nudgesDeclined += 1;
    if (reason) t.declineReasons[reason] += 1;
  }

  getSummary(stationId: string): StationTelemetry {
    return this.getOrCreate(stationId);
  }
}
