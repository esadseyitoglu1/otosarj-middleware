// Public API - @otosarj/engine
// Bu paket framework-bagimsiz, saf TypeScript. server ve web paketleri
// yalnizca bu dosyadan import eder.

export * from './types.js';
export { decide } from './decide.js';
export type { DecideParams } from './decide.js';
export { computeEffectivePower, computeCabinetShareKw } from './power.js';
export { estimateChargeTime } from './chargeTime.js';
export type { ChargeTimeEstimate } from './chargeTime.js';
export { findBestAlternative, chargingSiblingIds } from './alternatives.js';
export type { AlternativeCandidate } from './alternatives.js';
export { computeOperatorImpact } from './operatorImpact.js';
export {
  createSuppressionRecord,
  shouldSuppress,
  pruneExpired,
} from './suppression.js';
export {
  buildNudgeMessageR1,
  buildNudgeMessageR2,
  buildProceedMessage,
  buildBlockMessage,
} from './messages.js';

// Demo/test fixture'lari -- Asama 2 saha secici ve testler icin
export { otoprizStation } from './fixtures/station-otopriz.js';
export { largeOperatorStation } from './fixtures/station-large-operator.js';
export { vehicleFixtures, findVehicleById } from './fixtures/vehicles.js';
