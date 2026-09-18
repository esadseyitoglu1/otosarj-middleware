/**
 * Server-tarafi suppression store. engine'in shouldSuppress/pruneExpired
 * saf fonksiyonlarini bellek-ici bir listeyle sarmalayan ince katman.
 *
 * GUVENLIK/GIZLILIK (plan G2): kayitlar sadece pseudonim sessionId +
 * stationId + evseId + kural tasir, kisisel veri icermez. Periyodik
 * temizlik ile TTL'i gecmis kayitlar silinir.
 */
import {
  createSuppressionRecord,
  pruneExpired,
  shouldSuppress,
  type SuppressionRecord,
  type TriggeredRule,
} from '@otosarj/engine';

export class SuppressionStore {
  private records: SuppressionRecord[] = [];

  shouldSuppress(
    sessionId: string,
    stationId: string,
    evseId: string,
    rule: TriggeredRule
  ): boolean {
    this.prune();
    return shouldSuppress(sessionId, stationId, evseId, rule, this.records);
  }

  recordDecline(
    sessionId: string,
    stationId: string,
    evseId: string,
    rule: TriggeredRule
  ): void {
    this.records.push(createSuppressionRecord(sessionId, stationId, evseId, rule));
  }

  getHistory(): readonly SuppressionRecord[] {
    this.prune();
    return this.records;
  }

  private prune(): void {
    this.records = pruneExpired(this.records);
  }
}
