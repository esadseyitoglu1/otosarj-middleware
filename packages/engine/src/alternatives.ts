/**
 * Sahadaki en iyi alternatif soketi bulur.
 *
 * GUVENLIK/UX KARARI (bkz. plan "Yanlis-Pozitif Riski" ve Guvenlik G4):
 * Faz 1'de yalnizca AYNI operatorun sokedi onerilir. Farkli operatore
 * yonlendirme fiyat/tarife itirazlarini acar ve capraz-operator veri
 * paylasimi gerektirir -- bu Faz 2 kapsaminda.
 */
import type { Evse, PowerSharingGroup, Station, VehicleProfile } from './types.js';
import { computeEffectivePower } from './power.js';

export interface AlternativeCandidate {
  evse: Evse;
  effectivePowerKw: number;
  walkingDistanceM: number;
}

export interface AlternativeRequirements {
  ratedPowerBelowKw?: number;
  minEffectivePowerKw?: number;
}

function chargingSiblingIds(station: Station, evse: Evse): string[] {
  if (!evse.powerSharingGroupId) return [];
  return station.evses
    .filter(
      (e) =>
        e.powerSharingGroupId === evse.powerSharingGroupId &&
        e.status === 'charging'
    )
    .map((e) => e.id);
}

export function findBestAlternative(
  station: Station,
  vehicle: VehicleProfile,
  excludeEvseId: string,
  requirements: AlternativeRequirements = {}
): AlternativeCandidate | null {
  const groupsById = new Map<string, PowerSharingGroup>(
    station.powerSharingGroups.map((g) => [g.id, g])
  );

  const candidates: AlternativeCandidate[] = station.evses
    .filter(
      (e) =>
        e.id !== excludeEvseId &&
        e.status === 'available' &&
        e.connectorType === vehicle.connectorType &&
        // Faz 1 kisiti: sadece ayni operator. Faz 1'de zaten tum saha tek
        // operatore ait olacak sekilde fixture kuruluyor, ama motor bu
        // kurala acikca uymali -- gelecekte karma saha verisi gelirse
        // yanlislikla capraz-operator oneri uretilmesin.
        e.operatorId === station.operatorId
    )
    .map((e) => {
      const group = e.powerSharingGroupId
        ? groupsById.get(e.powerSharingGroupId) ?? null
        : null;
      const siblings = chargingSiblingIds(station, e);
      const effectivePowerKw = computeEffectivePower(e, group, vehicle, siblings);
      return { evse: e, effectivePowerKw, walkingDistanceM: e.walkingDistanceM };
    })
    // Kural kosullarini skordan once uygula: uygun olmayan yakin bir aday,
    // daha uzaktaki ama gecerli bir alternatifi gizlememeli.
    .filter(
      (candidate) =>
        (requirements.ratedPowerBelowKw === undefined ||
          candidate.evse.ratedPowerKw < requirements.ratedPowerBelowKw) &&
        (requirements.minEffectivePowerKw === undefined ||
          candidate.effectivePowerKw >= requirements.minEffectivePowerKw)
    );

  if (candidates.length === 0) return null;

  // Skorlama: efektif guc agirlikli, yurume mesafesi hafif cezali.
  // 1 kW = ~6 saniyelik yurume mesafesine esdeger agirlikta (heuristik).
  const scored = candidates
    .map((c) => ({
      candidate: c,
      score: c.effectivePowerKw - c.walkingDistanceM * 0.15,
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]!.candidate;
}

export { chargingSiblingIds };
