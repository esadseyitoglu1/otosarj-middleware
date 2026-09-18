/**
 * R5 - Suppression: ayni oturum, ayni saha, ayni kural icin uyari
 * daha once reddedildiyse tekrar gosterilmez. Bir kere bilgilendirdik,
 * israr etmek urunu sinir bozucu yapar (bkz. plan "Yanlis-Pozitif Riski").
 *
 * GUVENLIK/GIZLILIK (bkz. Guvenlik G2): Kayitlar KISA TTL ile tutulur
 * (varsayilan 24 saat) ve yalnizca pseudonim sessionId + stationId +
 * evseId + kural tasir -- hicbir kisisel veri (plaka/VIN/isim) icermez.
 * TTL sonunda kayit gecersiz sayilir; caller (server katmani) periyodik
 * temizlik yapmalidir.
 */
import type { SuppressionRecord, TriggeredRule } from './types.js';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat

export function createSuppressionRecord(
  sessionId: string,
  stationId: string,
  evseId: string,
  triggeredRule: TriggeredRule,
  nowMs: number = Date.now(),
  ttlMs: number = DEFAULT_TTL_MS
): SuppressionRecord {
  return {
    sessionId,
    stationId,
    evseId,
    triggeredRule,
    expiresAtMs: nowMs + ttlMs,
  };
}

export function shouldSuppress(
  sessionId: string,
  stationId: string,
  evseId: string,
  triggeredRule: TriggeredRule,
  history: readonly SuppressionRecord[],
  nowMs: number = Date.now()
): boolean {
  return history.some(
    (r) =>
      r.sessionId === sessionId &&
      r.stationId === stationId &&
      r.evseId === evseId &&
      r.triggeredRule === triggeredRule &&
      r.expiresAtMs > nowMs
  );
}

/** Suresi gecmis kayitlari temizler -- server katmani periyodik cagirmali. */
export function pruneExpired(
  history: readonly SuppressionRecord[],
  nowMs: number = Date.now()
): SuppressionRecord[] {
  return history.filter((r) => r.expiresAtMs > nowMs);
}
