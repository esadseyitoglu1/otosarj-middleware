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
    `Dikkat: Bu sokete takarsaniz hiziniz ${kwSelected} kW'a bolunecek. ` +
    `${meters} metre yaninizdaki bos ${recommendedEvseId} kabinine gecerek ` +
    `${kwRecommended} kW tam guçle sarj olabilirsiniz. Tercih sizin.`
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
    `Bilginize: araciniz en fazla ${Math.round(vehicleMaxKw)} kW cekebiliyor, ` +
    `bu soket ise ${Math.round(selectedRatedKw)} kW. Ayni surede sarj olup ` +
    `${meters} metre yaninizdaki ${recommendedEvseId} kabinini bosaltabilir, ` +
    `arkanizdaki suruculere de yer acabilirsiniz (o kabin ${kwRecommended} kW veriyor). Tercih sizin.`
  );
}

export function buildProceedMessage(): string {
  return 'Seciminiz uygun. Iyi sarjlar.';
}

export function buildBlockMessage(connectorType: string): string {
  return `Bu soket aracinizin konnektor tipiyle (${connectorType}) uyumlu degil.`;
}
