/**
 * Buyuk operator sahasi (jenerik, ornegin ZES/Trugo tipi) -- 300 kW
 * soket dahil. Bu fixture R2 (kapasite asiri-tahsisi) senaryosunu
 * gostermek icin var: OtoPriz'de 300 kW olmadigi icin R2 orada
 * neredeyse hic tetiklenmiyor (plan bulgusu B), ama urun operator-
 * agnostik oldugu icin 300 kW'li sahalarda da calismali.
 *
 * Ayni motor (decide.ts), sadece station fixture'i degistirilerek
 * bu sahada da dogru calisir -- operator-agnostik oldugunun kod
 * seviyesinde kaniti budur (bkz. plan bolum I ve H).
 */
import type { Station } from '../types.js';

const DC_TARIFF_TL_PER_KWH = 15.5;

export const largeOperatorStation: Station = {
  id: 'buyuk-operator-ornek',
  name: 'Buyuk Operator Ornek Sahasi (300 kW dahil)',
  operatorId: 'buyuk-operator',
  powerSharingGroups: [],
  evses: [
    {
      id: 'ultra-1',
      ratedPowerKw: 300,
      connectorType: 'CCS2',
      status: 'available',
      liveDrawKw: null,
      powerSharingGroupId: null,
      walkingDistanceM: 0,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'buyuk-operator',
    },
    {
      id: 'ultra-2',
      ratedPowerKw: 300,
      connectorType: 'CCS2',
      status: 'charging',
      liveDrawKw: 280,
      powerSharingGroupId: null,
      walkingDistanceM: 8,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'buyuk-operator',
    },
    {
      id: 'fast-1',
      ratedPowerKw: 120,
      connectorType: 'CCS2',
      status: 'available',
      liveDrawKw: null,
      powerSharingGroupId: null,
      walkingDistanceM: 10,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'buyuk-operator',
    },
    {
      id: 'fast-2',
      ratedPowerKw: 60,
      connectorType: 'CHAdeMO',
      status: 'available',
      liveDrawKw: null,
      powerSharingGroupId: null,
      walkingDistanceM: 14,
      tariffTlPerKwh: DC_TARIFF_TL_PER_KWH,
      operatorId: 'buyuk-operator',
    },
  ],
};
