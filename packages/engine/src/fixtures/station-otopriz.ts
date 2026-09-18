/**
 * Gercekci OtoPriz sahasi.
 *
 * Arastirma bulgusu (plan bolum B): OtoPriz'de en yuksek guc 180 kW,
 * 300 kW soket bulunmuyor. Gercek saha ornegi (Otopriz Taspinar/Pozanti):
 * 4x 120 kW DC + 1x 22 kW AC. DC tarife 13.90 TL/kWh.
 *
 * Bu fixture'da R1 (power-sharing) ana senaryo: Kabin 1 (1A/1B) ve
 * Kabin 2 (2A/2B) 180 kW paylasimli. Kabin 3 ve 4, Taspinar orneginde
 * oldugu gibi 120 kW bagimsiz.
 */
import type { Station } from '../types.js';

const DC_TARIFF_TL_PER_KWH = 13.9;

export const otoprizStation: Station = {
  id: 'otopriz-taspinar-benzeri',
  name: 'OtoPriz Ornek Sahasi (180/120 kW)',
  operatorId: 'otopriz',
  powerSharingGroups: [
    {
      id: 'cabinet-1',
      cabinetMaxPowerKw: 180,
      evseIds: ['1A', '1B'],
      sharingMode: 'equal-split',
    },
    {
      id: 'cabinet-2',
      cabinetMaxPowerKw: 180,
      evseIds: ['2A', '2B'],
      sharingMode: 'equal-split',
    },
  ],
  evses: [
    // Kabin 1: paylasimli, senaryo A'da 1A dolu olacak
    {
      id: '1A',
      ratedPowerKw: 180,
      connectorType: 'CCS2',
      status: 'charging',
      liveDrawKw: 180,
      powerSharingGroupId: 'cabinet-1',
      walkingDistanceM: 0,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'otopriz',
    },
    {
      id: '1B',
      ratedPowerKw: 180,
      connectorType: 'CCS2',
      status: 'available',
      liveDrawKw: null,
      powerSharingGroupId: 'cabinet-1',
      walkingDistanceM: 3,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'otopriz',
    },
    // Kabin 2: paylasimli, tamamen bos -- R1'in onerdigi alternatif
    {
      id: '2A',
      ratedPowerKw: 180,
      connectorType: 'CCS2',
      status: 'available',
      liveDrawKw: null,
      powerSharingGroupId: 'cabinet-2',
      walkingDistanceM: 12,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'otopriz',
    },
    {
      id: '2B',
      ratedPowerKw: 180,
      connectorType: 'CCS2',
      status: 'available',
      liveDrawKw: null,
      powerSharingGroupId: 'cabinet-2',
      walkingDistanceM: 15,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'otopriz',
    },
    // Kabin 3-4: bagimsiz 120 kW soketler (Taspinar orneginde oldugu gibi)
    {
      id: '3',
      ratedPowerKw: 120,
      connectorType: 'CCS2',
      status: 'available',
      liveDrawKw: null,
      powerSharingGroupId: null,
      walkingDistanceM: 25,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'otopriz',
    },
    {
      id: '4',
      ratedPowerKw: 120,
      connectorType: 'CHAdeMO',
      status: 'available',
      liveDrawKw: null,
      powerSharingGroupId: null,
      walkingDistanceM: 28,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'otopriz',
    },
  ],
};
