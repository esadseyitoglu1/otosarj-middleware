/**
 * Sarj suresi tahmini -- basitlestirilmis ama SABIT GUC VARSAYMAYAN bir taper modeli.
 *
 * Gercek DC sarj egrileri arac/sicaklik bagimlidir (bkz. KNOWN_ISSUES).
 * Burada kullanilan model: %0-%50 arasi efektif guc ~sabit, %50-%80 arasi
 * lineer azalan, %80 ustu daha da yavaslayan bir egri. Amac gercek fizigi
 * birebir modellemek degil, "300 kW soket sabit 300 kW'ta 80'e kadar gider"
 * gibi naif/yanlis bir varsayimdan kacinmak.
 *
 * EPDK 23 Mart 2026 yonetmeligi: DC sarj unitelerinde batarya %85 ve
 * uzerine ulasan araclarda, kullaniciya onceden bilgi verilmesi sartiyla
 * sarj sonlandirilabilir. Bu fonksiyon %85 esigini ayri olarak isaretler.
 */

const TAPER_BREAKPOINTS = [
  { soc: 0, powerMultiplier: 1.0 },
  { soc: 50, powerMultiplier: 1.0 },
  { soc: 80, powerMultiplier: 0.4 },
  { soc: 100, powerMultiplier: 0.15 },
] as const;

function powerMultiplierAtSoc(socPercent: number): number {
  const clamped = Math.max(0, Math.min(100, socPercent));
  for (let i = 0; i < TAPER_BREAKPOINTS.length - 1; i++) {
    const cur = TAPER_BREAKPOINTS[i]!;
    const next = TAPER_BREAKPOINTS[i + 1]!;
    if (clamped >= cur.soc && clamped <= next.soc) {
      const span = next.soc - cur.soc;
      const t = span === 0 ? 0 : (clamped - cur.soc) / span;
      return cur.powerMultiplier + t * (next.powerMultiplier - cur.powerMultiplier);
    }
  }
  return TAPER_BREAKPOINTS[TAPER_BREAKPOINTS.length - 1]!.powerMultiplier;
}

export interface ChargeTimeEstimate {
  minutesToTarget: number;
  /** EPDK md. geregi %85'te operator sarji sonlandirabilir -- bilgilendirme amacli. */
  eligibleForEpdkCutoffAt85: boolean;
}

/**
 * fromSocPercent'ten toSocPercent'e (varsayilan 80) ulasmak icin geciken
 * dakikayi, taper egrisini 1'er puanlik adimlarla sayisal integre ederek hesaplar.
 */
export function estimateChargeTime(
  batteryKwh: number,
  effectivePowerKw: number,
  fromSocPercent: number,
  toSocPercent = 80
): ChargeTimeEstimate {
  if (effectivePowerKw <= 0 || toSocPercent <= fromSocPercent) {
    return { minutesToTarget: 0, eligibleForEpdkCutoffAt85: fromSocPercent >= 85 };
  }

  const STEP = 1; // yuzde puani
  let totalHours = 0;

  for (let soc = fromSocPercent; soc < toSocPercent; soc += STEP) {
    const stepSize = Math.min(STEP, toSocPercent - soc);
    const multiplier = powerMultiplierAtSoc(soc + stepSize / 2);
    const stepKwh = batteryKwh * (stepSize / 100);
    const stepPowerKw = effectivePowerKw * multiplier;
    totalHours += stepKwh / stepPowerKw;
  }

  return {
    minutesToTarget: Math.round(totalHours * 60),
    eligibleForEpdkCutoffAt85: toSocPercent >= 85,
  };
}
