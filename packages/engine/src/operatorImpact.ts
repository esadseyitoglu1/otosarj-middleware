/**
 * Operator etkisi hesabi: "daha fazla kWh satarsiniz" tuzagina DUSMEZ.
 *
 * Kar argumani kWh fiyatindan degil, o seansta AYNI SURE icinde
 * satilabilecek ek kWh'den geliyor -- yani suren aracin dusuk guc
 * cekmesi yuzunden bosa giden kapasiteden. Detay: plan "Karlilik Modeli".
 *
 * Bu fonksiyon tek bir kararin (Decision) etkisini hesaplar; sahanin
 * genelindeki peak/off-peak ayrimi ROI modelinde (Asama 2) yapilir --
 * burada tek-seans dogrulugu yeterli.
 */
import type { OperatorImpact } from './types.js';

export function computeOperatorImpact(
  selectedEffectivePowerKw: number,
  recommendedEffectivePowerKw: number,
  estimatedSessionMinutes: number,
  tariffTlPerKwh: number
): OperatorImpact {
  const powerGainKw = Math.max(
    0,
    recommendedEffectivePowerKw - selectedEffectivePowerKw
  );
  const hours = estimatedSessionMinutes / 60;
  const kwhThroughputGainKwh = Math.round(powerGainKw * hours * 100) / 100;
  const revenueOpportunityTl =
    Math.round(kwhThroughputGainKwh * tariffTlPerKwh * 100) / 100;

  return { kwhThroughputGainKwh, revenueOpportunityTl };
}
