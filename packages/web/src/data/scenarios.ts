/**
 * Hazir demo senaryolari (plan Adim 1.5).
 * Her biri saha + arac + hedef soket + kisa aciklama tasir.
 * "reset" adimi backend'deki mock CSMS durumunu baslangica dondurur.
 */
export interface ScenarioDef {
  id: string;
  label: string;
  description: string;
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
    label: 'A · Power-sharing (ana senaryo)',
    description:
      'Kabin 1A dolu, siz 1B\'yi okutuyorsunuz. Kabin 2 tamamen boş.',
    stationId: 'otopriz-taspinar-benzeri',
    vehicleProfileId: 'togg-t10x-rwd',
    scannedEvseId: '1B',
    presetOccupied: { evseId: '1A', liveDrawKw: 180 },
    expectedRule: 'R1',
  },
  {
    id: 'B',
    label: 'B · Kapasite aşırı-tahsisi',
    description:
      'Büyük operatör sahasında bir PHEV (50 kW), 300 kW\'lık soketi seçiyor.',
    stationId: 'buyuk-operator-ornek',
    vehicleProfileId: 'toyota-prius-phev',
    scannedEvseId: 'ultra-1',
    expectedRule: 'R2',
  },
  {
    id: 'C',
    label: 'C · Doğru seçim (negatif kontrol)',
    description:
      'IONIQ 5, boş bir 180 kW sokete takıyor. Motor sessiz kalmalı.',
    stationId: 'otopriz-taspinar-benzeri',
    vehicleProfileId: 'ioniq-5',
    scannedEvseId: '2A',
    expectedRule: 'PROCEED',
  },
];
