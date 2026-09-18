import { describe, expect, it } from 'vitest';
import { estimateChargeTime } from './chargeTime.js';

describe('estimateChargeTime', () => {
  it('taper modeli: %80 ustundeki sure %0-50 arasindan orantisiz uzun surmeli (dogrusal degil)', () => {
    // 0'dan 50'ye kadar gecen sure ile 50'den 80'e gecen surenin
    // "esit yuzde artisi = esit sure" varsayimi YANLIS olmali --
    // taper modeli 50 sonrasi guc dusurdugu icin 50->80 orantisiz uzun surer.
    const batteryKwh = 60;
    const powerKw = 150;

    const zeroToFifty = estimateChargeTime(batteryKwh, powerKw, 0, 50);
    const fiftyToEighty = estimateChargeTime(batteryKwh, powerKw, 50, 80);

    // Esit-yuzde-esit-sure varsayiminda 30 puanlik fifty->eighty,
    // 50 puanlik zero->fifty'nin %60'i kadar surer (dogrusal olsaydi).
    // Taper nedeniyle bu oran belirgin sekilde asilmali.
    const linearExpectedRatio = 30 / 50;
    const actualRatio = fiftyToEighty.minutesToTarget / zeroToFifty.minutesToTarget;

    expect(actualRatio).toBeGreaterThan(linearExpectedRatio);
  });

  it('guc arttikca sure azalmali', () => {
    const slow = estimateChargeTime(60, 50, 10, 80);
    const fast = estimateChargeTime(60, 180, 10, 80);
    expect(fast.minutesToTarget).toBeLessThan(slow.minutesToTarget);
  });

  it('hedef zaten asilmissa sure 0 donmeli', () => {
    const result = estimateChargeTime(60, 100, 85, 80);
    expect(result.minutesToTarget).toBe(0);
  });

  it('%85 hedefte EPDK sonlandirma bayragi isaretlenmeli', () => {
    const below = estimateChargeTime(60, 100, 10, 80);
    const at85 = estimateChargeTime(60, 100, 10, 85);
    expect(below.eligibleForEpdkCutoffAt85).toBe(false);
    expect(at85.eligibleForEpdkCutoffAt85).toBe(true);
  });

  it('guc sifir veya negatifse sure 0 donmeli (crash etmemeli)', () => {
    const result = estimateChargeTime(60, 0, 10, 80);
    expect(result.minutesToTarget).toBe(0);
  });
});
