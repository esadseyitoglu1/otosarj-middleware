/**
 * Efektif guc hesaplamasi: uc olasi darbogazin minimumu.
 * 1) Soketin nominal gucu
 * 2) Paylasimli kabinde bu soketin payina dusen guc (digerleri doluysa dusuyor)
 * 3) Aracin fiziksel olarak cekebilecegi azami guc
 */
import type { Evse, PowerSharingGroup, VehicleProfile } from './types.js';

export function computeCabinetShareKw(
  evse: Evse,
  group: PowerSharingGroup | null
): number {
  if (!group) return evse.ratedPowerKw;

  const activeSiblings = group.evseIds.filter((id) => id !== evse.id);
  // Bu fonksiyon sadece "digerleri doluysa payin ne olacagi" sorusuna
  // cevap verir; caller'in hangi siblinglerin gercekten 'charging'
  // oldugunu belirlemesi gerekir -- bkz. computeEffectivePower.
  if (activeSiblings.length === 0) return group.cabinetMaxPowerKw;

  if (group.sharingMode === 'equal-split') {
    return group.cabinetMaxPowerKw / (activeSiblings.length + 1);
  }

  // dynamic-allocation: basitlestirilmis model -- MVP'de esit varsayilir,
  // gercek CSMS'ler ihtiyaca gore asimetrik dagitabilir (orn. 120+60).
  return group.cabinetMaxPowerKw / (activeSiblings.length + 1);
}

/**
 * Bir EVSE'ye simdi taksaydik alinacak efektif guc.
 * chargingSiblingIds: ayni grupta su an 'charging' durumunda olan diger EVSE id'leri.
 */
export function computeEffectivePower(
  evse: Evse,
  group: PowerSharingGroup | null,
  vehicle: VehicleProfile,
  chargingSiblingIds: string[]
): number {
  let cabinetShareKw = evse.ratedPowerKw;

  if (group) {
    const activeSiblingCount = chargingSiblingIds.filter(
      (id) => id !== evse.id
    ).length;
    cabinetShareKw =
      activeSiblingCount === 0
        ? Math.min(evse.ratedPowerKw, group.cabinetMaxPowerKw)
        : group.cabinetMaxPowerKw / (activeSiblingCount + 1);
  }

  return Math.min(evse.ratedPowerKw, cabinetShareKw, vehicle.maxDcPowerKw);
}
