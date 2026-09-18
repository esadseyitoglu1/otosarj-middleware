/**
 * Sahalarin GORSEL yerlesim bilgisi (kabin gruplama, koordinat vb).
 * Bu, engine'deki Station verisiyle ayni degil -- o verinin nasil
 * cizilecegini tarif eder. Iki sahayi da (OtoPriz + buyuk operator)
 * kapsar, boylece saha secici anlik gecis yapabilir.
 */
import type { Station } from '@otosarj/engine';

export interface CabinetLayout {
  id: string;
  label: string;
  evseIds: string[];
  maxKw: number;
  shared: boolean;
}

export interface StationLayout {
  stationId: string;
  displayName: string;
  cabinets: CabinetLayout[];
}

export const otoprizLayout: StationLayout = {
  stationId: 'otopriz-taspinar-benzeri',
  displayName: 'OtoPriz Sahası',
  cabinets: [
    { id: 'cabinet-1', label: 'Kabin 1', evseIds: ['1A', '1B'], maxKw: 180, shared: true },
    { id: 'cabinet-2', label: 'Kabin 2', evseIds: ['2A', '2B'], maxKw: 180, shared: true },
    { id: 'cabinet-3', label: 'Kabin 3', evseIds: ['3'], maxKw: 120, shared: false },
    { id: 'cabinet-4', label: 'Kabin 4', evseIds: ['4'], maxKw: 120, shared: false },
  ],
};

export const largeOperatorLayout: StationLayout = {
  stationId: 'buyuk-operator-ornek',
  displayName: 'Büyük Operatör Sahası',
  cabinets: [
    { id: 'ultra-1', label: 'Ultra 1', evseIds: ['ultra-1'], maxKw: 300, shared: false },
    { id: 'ultra-2', label: 'Ultra 2', evseIds: ['ultra-2'], maxKw: 300, shared: false },
    { id: 'fast-1', label: 'Hızlı 1', evseIds: ['fast-1'], maxKw: 120, shared: false },
    { id: 'fast-2', label: 'Hızlı 2', evseIds: ['fast-2'], maxKw: 60, shared: false },
  ],
};

export function findEvseInStation(station: Station, evseId: string) {
  return station.evses.find((e) => e.id === evseId) ?? null;
}
