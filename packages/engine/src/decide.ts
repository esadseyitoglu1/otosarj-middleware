/**
 * Karar motoru -- bu projenin gercek IP'si.
 *
 * Saf fonksiyon: decide(input) => Decision. Yan etkisiz, test edilebilir,
 * framework'ten tamamen bagimsiz. Suppression gecmisi (history) disaridan
 * verilir -- motor kendi state'ini tutmaz (bkz. Guvenlik G2: stateless).
 *
 * Kural sirasi (plan "AŞAMA 1 / Adim 1.3"):
 *   R1 - Power-sharing cakismasi (ANA HIKAYE, OtoPriz'de asil senaryo)
 *   R2 - Kapasite asiri-tahsisi (IKINCIL, OtoPriz'de nadir ama buyuk
 *        operatorlerde -- 300 kW soketler -- gecerli)
 *   R3 - Konnektor uyumsuzlugu (sert engel)
 *   R4 - Alternatif yok / secim zaten optimal
 *   R5 - Suppression (ayni uyari daha once reddedildiyse sessiz gec)
 *
 * OtoPriz'de 300 kW soket bulunmuyor (arastirma bulgusu B) -- bu yuzden
 * R1 kontrolu R2'den ONCE calisir ve R1 tetiklenirse R2 hic degerlendirilmez.
 * Iki kural ayni EVSE icin ayni anda tetiklenebilir teorik olarak ama
 * pratikte OtoPriz sahalarinda R1 baskin senaryo.
 */
import type {
  Decision,
  Evse,
  PowerSharingGroup,
  ScanInput,
  Station,
  SuppressionRecord,
  VehicleProfile,
} from './types.js';
import { computeEffectivePower } from './power.js';
import { estimateChargeTime } from './chargeTime.js';
import { findBestAlternative, chargingSiblingIds } from './alternatives.js';
import { computeOperatorImpact } from './operatorImpact.js';
import { shouldSuppress } from './suppression.js';
import {
  buildBlockMessage,
  buildNudgeMessageR1,
  buildNudgeMessageR2,
  buildProceedMessage,
} from './messages.js';

/** R2'de "asiri-tahsis" sayilmasi icin soket/arac guc orani esigi. */
const OVER_PROVISION_RATIO_THRESHOLD = 2;

export interface DecideParams {
  input: ScanInput;
  station: Station;
  vehicle: VehicleProfile | null;
  suppressionHistory: readonly SuppressionRecord[];
  nowMs?: number;
}

function findEvse(station: Station, evseId: string): Evse | null {
  return station.evses.find((e) => e.id === evseId) ?? null;
}

function findGroup(
  station: Station,
  groupId: string | null
): PowerSharingGroup | null {
  if (!groupId) return null;
  return station.powerSharingGroups.find((g) => g.id === groupId) ?? null;
}

function proceedDecision(
  selectedEvseId: string,
  effectivePowerKw: number,
  estMinutesTo80: number,
  reasoning: string[]
): Decision {
  return {
    verdict: 'PROCEED',
    triggeredRule: null,
    selected: { evseId: selectedEvseId, effectivePowerKw, estMinutesTo80 },
    recommended: null,
    driverMessage: buildProceedMessage(),
    operatorImpact: { kwhThroughputGainKwh: 0, revenueOpportunityTl: 0 },
    reasoning,
  };
}

export function decide(params: DecideParams): Decision {
  const { input, station, vehicle, suppressionHistory, nowMs = Date.now() } =
    params;
  const reasoning: string[] = [];

  const evse = findEvse(station, input.scannedEvseId);
  if (!evse) {
    // Bilinmeyen EVSE: sunucu katmani bunu zaten 400 ile reddetmeli
    // (bkz. Guvenlik G3), ama motor da savunmaci davranir.
    reasoning.push(`Soket bulunamadi: ${input.scannedEvseId}`);
    return proceedDecision(input.scannedEvseId, 0, 0, reasoning);
  }
  reasoning.push(
    `Taranan soket: ${evse.id} (${evse.ratedPowerKw} kW, ${evse.connectorType})`
  );

  // Arac profili yoksa R1/R2 degerlendirilemez -- sadece R3 (konnektor) calisir.
  if (!vehicle) {
    reasoning.push('Arac profili yok, sadece konnektor uyumu kontrol edilecek.');
    return proceedDecision(evse.id, evse.ratedPowerKw, 0, reasoning);
  }
  reasoning.push(
    `Arac: ${vehicle.makeModel} (max ${vehicle.maxDcPowerKw} kW, ${vehicle.connectorType})`
  );

  // --- R3: Konnektor uyumsuzlugu (sert engel, en once kontrol edilir) ---
  if (evse.connectorType !== vehicle.connectorType) {
    reasoning.push(
      `Konnektor uyumsuz: soket ${evse.connectorType}, arac ${vehicle.connectorType}.`
    );
    return {
      verdict: 'BLOCK',
      triggeredRule: 'R3',
      selected: { evseId: evse.id, effectivePowerKw: 0, estMinutesTo80: 0 },
      recommended: null,
      driverMessage: buildBlockMessage(evse.connectorType),
      operatorImpact: { kwhThroughputGainKwh: 0, revenueOpportunityTl: 0 },
      reasoning,
    };
  }

  const group = findGroup(station, evse.powerSharingGroupId);
  const siblingIds = chargingSiblingIds(station, evse);
  const selectedEffectiveKw = computeEffectivePower(
    evse,
    group,
    vehicle,
    siblingIds
  );
  const selectedEstimate = estimateChargeTime(
    vehicle.batteryKwh,
    selectedEffectiveKw,
    input.currentSocPercent
  );
  reasoning.push(
    `Bu soketteki efektif guc: ${selectedEffectiveKw.toFixed(1)} kW ` +
      `(tahmini %80'e ${selectedEstimate.minutesToTarget} dk).`
  );

  // --- R1: Power-sharing cakismasi (ANA HIKAYE) ---
  if (group && siblingIds.length > 0) {
    reasoning.push(
      `Paylasimli kabin (${group.id}): ${siblingIds.length} komsu soket sarj halinde, guc bolunuyor.`
    );
    const alternative = findBestAlternative(station, vehicle, evse.id);
    if (alternative && alternative.effectivePowerKw > selectedEffectiveKw) {
      const rule = 'R1' as const;
      if (
        shouldSuppress(
          input.sessionId,
          station.id,
          evse.id,
          rule,
          suppressionHistory,
          nowMs
        )
      ) {
        reasoning.push('R1 tetiklendi ama bu uyari daha once reddedilmisti -> sessiz gec (R5).');
        return proceedDecision(
          evse.id,
          selectedEffectiveKw,
          selectedEstimate.minutesToTarget,
          reasoning
        );
      }

      const altEstimate = estimateChargeTime(
        vehicle.batteryKwh,
        alternative.effectivePowerKw,
        input.currentSocPercent
      );
      reasoning.push(
        `Daha iyi alternatif bulundu: ${alternative.evse.id} ` +
          `(${alternative.effectivePowerKw.toFixed(1)} kW, ${altEstimate.minutesToTarget} dk).`
      );
      return {
        verdict: 'NUDGE',
        triggeredRule: rule,
        selected: {
          evseId: evse.id,
          effectivePowerKw: selectedEffectiveKw,
          estMinutesTo80: selectedEstimate.minutesToTarget,
        },
        recommended: {
          evseId: alternative.evse.id,
          effectivePowerKw: alternative.effectivePowerKw,
          estMinutesTo80: altEstimate.minutesToTarget,
          walkingDistanceM: alternative.walkingDistanceM,
        },
        driverMessage: buildNudgeMessageR1(
          selectedEffectiveKw,
          alternative.evse.id,
          alternative.effectivePowerKw,
          alternative.walkingDistanceM
        ),
        operatorImpact: computeOperatorImpact(
          selectedEffectiveKw,
          alternative.effectivePowerKw,
          altEstimate.minutesToTarget,
          evse.tariffTlPerKwh
        ),
        reasoning,
      };
    }
    reasoning.push('Alternatif yok ya da daha iyi degil -> R1 tetiklenmedi.');
  }

  // --- R2: Kapasite asiri-tahsisi (IKINCIL) ---
  const overProvisionRatio = evse.ratedPowerKw / Math.max(vehicle.maxDcPowerKw, 1);
  if (overProvisionRatio >= OVER_PROVISION_RATIO_THRESHOLD) {
    reasoning.push(
      `Soket/arac guc orani ${overProvisionRatio.toFixed(1)}x (esik: ${OVER_PROVISION_RATIO_THRESHOLD}x) -> asiri-tahsis supheli.`
    );
    const alternative = findBestAlternative(station, vehicle, evse.id);
    // R2'de alternatifin mutlaka DAHA YUKSEK guc vermesi sart degil --
    // amac ayni suredeki fırsat maliyetini azaltmak, aracin zaten
    // maxDcPowerKw ile sinirlandigi icin alternatif de en az ayni hizi
    // verirse yeterli (soket israfini onler).
    if (alternative && alternative.effectivePowerKw >= selectedEffectiveKw) {
      const rule = 'R2' as const;
      if (
        shouldSuppress(
          input.sessionId,
          station.id,
          evse.id,
          rule,
          suppressionHistory,
          nowMs
        )
      ) {
        reasoning.push('R2 tetiklendi ama bu uyari daha once reddedilmisti -> sessiz gec (R5).');
        return proceedDecision(
          evse.id,
          selectedEffectiveKw,
          selectedEstimate.minutesToTarget,
          reasoning
        );
      }

      const altEstimate = estimateChargeTime(
        vehicle.batteryKwh,
        alternative.effectivePowerKw,
        input.currentSocPercent
      );
      reasoning.push(
        `Fırsat maliyeti onerisi: ${alternative.evse.id} ayni hizda sarj saglar, ` +
          `bu yuksek guclu soketi baska arac icin bosaltir.`
      );
      return {
        verdict: 'NUDGE',
        triggeredRule: rule,
        selected: {
          evseId: evse.id,
          effectivePowerKw: selectedEffectiveKw,
          estMinutesTo80: selectedEstimate.minutesToTarget,
        },
        recommended: {
          evseId: alternative.evse.id,
          effectivePowerKw: alternative.effectivePowerKw,
          estMinutesTo80: altEstimate.minutesToTarget,
          walkingDistanceM: alternative.walkingDistanceM,
        },
        driverMessage: buildNudgeMessageR2(
          vehicle.maxDcPowerKw,
          evse.ratedPowerKw,
          alternative.evse.id,
          alternative.effectivePowerKw,
          alternative.walkingDistanceM
        ),
        operatorImpact: computeOperatorImpact(
          selectedEffectiveKw,
          alternative.effectivePowerKw,
          altEstimate.minutesToTarget,
          evse.tariffTlPerKwh
        ),
        reasoning,
      };
    }
    reasoning.push('Alternatif yok ya da daha iyi degil -> R2 tetiklenmedi.');
  }

  // --- R4: Secim zaten optimal / alternatif yok ---
  reasoning.push('Secim uygun goruluyor, motor devreye girmiyor.');
  return proceedDecision(
    evse.id,
    selectedEffectiveKw,
    selectedEstimate.minutesToTarget,
    reasoning
  );
}
