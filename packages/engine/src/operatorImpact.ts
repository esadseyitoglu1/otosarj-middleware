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
  tariffTlPerKwh: number,
  /**
   * R2 icin: bosalan soketin NOMINAL gucu (araca degil, soketin kendisine
   * ait ratedPowerKw). Verilmezse freedCapacityKw 0 doner (R1 cagrisi gibi).
   */
  vacatedEvseRatedPowerKw?: number
): OperatorImpact {
  const powerGainKw = Math.max(
    0,
    recommendedEffectivePowerKw - selectedEffectivePowerKw
  );
  const hours = estimatedSessionMinutes / 60;
  const kwhThroughputGainKwh = Math.round(powerGainKw * hours * 100) / 100;
  const revenueOpportunityTl =
    Math.round(kwhThroughputGainKwh * tariffTlPerKwh * 100) / 100;

  // Kapasite kurtarma: bu seansin kendi throughput'u degil, bosalan
  // yuksek guclu soketin -- suru asiri-tahsis edilmis araci degil,
  // gercekten o gucu kullanabilecek bir sonraki araci -- agirlayabilme
  // potansiyeli. Sadece R2'de anlamli (R1'de soket zaten ayni kalir).
  const freedCapacityKw = vacatedEvseRatedPowerKw
    ? Math.max(0, Math.round((vacatedEvseRatedPowerKw - selectedEffectivePowerKw) * 100) / 100)
    : 0;

  return { kwhThroughputGainKwh, revenueOpportunityTl, freedCapacityKw };
}
