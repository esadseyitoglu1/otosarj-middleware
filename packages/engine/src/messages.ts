/**
 * Surucu mesajlari -- SABIT SABLONLARDAN uretilir.
 *
 * GUVENLIK (bkz. Guvenlik G4 - Nudge manipulasyonu): Bu fonksiyonlar
 * disinda hicbir yerde serbest metin/HTML birlestirilerek driverMessage
 * uretilmemelidir. Sadece sayisal degerler (kW, dakika, metre) sablona
 * enjekte edilir -- istemciden gelen string asla dogrudan mesaja girmez.
 *
 * TON ILKESI (bkz. plan "Yanlis-Pozitif Riski"):
 * "Yanlis sectiniz" degil, "bilginiz olsun, tercih sizin" tonu.
 * Surucu bilerek secmis olabilir (fiyat, park yeri, kisa mola vb.)
 * -- motor onu sorgulamiyor, sadece bilgi veriyor.
 */

export function buildNudgeMessageR1(
  selectedEffectiveKw: number,
  recommendedEvseId: string,
  recommendedEffectiveKw: number,
  walkingDistanceM: number
): string {
  const kwSelected = Math.round(selectedEffectiveKw);
  const kwRecommended = Math.round(recommendedEffectiveKw);
  const meters = Math.round(walkingDistanceM);
  return (
    `Bu soket gücü başka bir araçla paylaşıyor. Model tahmini: burada ${kwSelected} kW, ` +
    `boş ${recommendedEvseId} soketinde ${kwRecommended} kW. ` +
    `Aracınızı yaklaşık ${meters} metre ilerideki bu sokete alarak daha hızlı şarj olabilirsiniz. ` +
    `Gerçek güç araç ve saha koşullarına bağlıdır. Tercih sizin.`
  );
}

export function buildNudgeMessageR2(
  vehicleMaxKw: number,
  selectedRatedKw: number,
  recommendedEvseId: string,
  recommendedEffectiveKw: number,
  walkingDistanceM: number
): string {
  const meters = Math.round(walkingDistanceM);
  const kwRecommended = Math.round(recommendedEffectiveKw);
  return (
    `Aracınızın azami DC şarj gücü ${Math.round(vehicleMaxKw)} kW; seçtiğiniz soket ${Math.round(selectedRatedKw)} kW. ` +
    `Aracınızı yaklaşık ${meters} metre ilerideki daha düşük kapasiteli ${recommendedEvseId} soketine alabilirsiniz. ` +
    `Modele göre orada da ${kwRecommended} kW ile şarj süreniz uzamaz; ` +
    `böylece seçtiğiniz yüksek güçlü soket diğer sürücülere kalır. ` +
    `Gerçek güç araç ve saha koşullarına bağlıdır. Tercih sizin.`
  );
}

export function buildProceedMessage(): string {
  return 'Bu koşullarda başka bir soket önerimiz yok. İyi şarjlar.';
}

export function buildBlockMessage(connectorType: string): string {
  return `Bu soketin ${connectorType} bağlantısı aracınızla uyumlu değil.`;
}
