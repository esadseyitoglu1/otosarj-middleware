/**
 * Hazir demo senaryolari (plan Adim 1.5).
 * Her biri saha + arac + hedef soket + kisa aciklama tasir.
 * "reset" adimi backend'deki mock CSMS durumunu baslangica dondurur.
 */
export interface ScenarioDef {
  id: string;
  label: string;
  description: string;
  /** Operatör faydası özeti — opsiyonel, kart üzerinde gösterilir. */
  revenueHint?: string;
  stationId: string;
  vehicleProfileId: string;
  scannedEvseId: string;
  /** Senaryoyu kurmak icin oncesinde doldurulmasi gereken soket (varsa). */
  presetOccupied?: { evseId: string; liveDrawKw: number };
  expectedRule: 'R1' | 'R2' | 'PROCEED' | 'R5';
}

export const scenarios: ScenarioDef[] = [
  {
    id: 'A',
    label: 'A · Gücü paylaşmak zorunda mısınız?',
    description:
      '1A dolu, siz aynı kabindeki 1B soketini seçiyorsunuz. Yan kabin ise tamamen boş.',
    revenueHint: 'Daha uygun soketi ve tahmini süre farkını görün.',
    stationId: 'otopriz-taspinar-benzeri',
    vehicleProfileId: 'togg-t10x-rwd',
    scannedEvseId: '1B',
    presetOccupied: { evseId: '1A', liveDrawKw: 180 },
    expectedRule: 'R1',
  },
  {
    id: 'B',
    label: 'B · Aynı hız, daha uygun soket',
    description:
      '50 kW kapasiteli bir araç, 300 kW soketi seçiyor. Daha düşük güçlü boş seçenekler var.',
    revenueHint: 'Yüksek güçlü soket başka bir araca kalabilir.',
    stationId: 'buyuk-operator-ornek',
    vehicleProfileId: 'renault-zoe',
    scannedEvseId: 'ultra-1',
    expectedRule: 'R2',
  },
  {
    id: 'C',
    label: 'C · Seçim zaten uygunsa?',
    description:
      'Araç, boş bir kabindeki uygun soketi seçiyor. Daha iyi alternatif yoksa öneri gösterilmez.',
    revenueHint: 'Gereksiz uyarı yok; sürücü yoluna devam eder.',
    stationId: 'otopriz-taspinar-benzeri',
    vehicleProfileId: 'ioniq-5',
    scannedEvseId: '2A',
    expectedRule: 'PROCEED',
  },
];
