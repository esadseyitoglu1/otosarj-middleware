/**
 * Turkiye pazarina uygun arac profilleri.
 *
 * maxDcPowerKw degerleri uretici resmi verilerine yakin yuvarlanmis
 * gercekci degerlerdir; prototip amaclidir, arac bakimli bir DB'nin
 * yerine gecmez (bkz. KNOWN_ISSUES).
 */
import type { VehicleProfile } from '../types.js';

export const vehicleFixtures: VehicleProfile[] = [
  {
    id: 'togg-t10x-rwd',
    makeModel: 'Togg T10X (RWD)',
    maxDcPowerKw: 180,
    architecture: '800V',
    batteryKwh: 88.5,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'togg-t10x-awd',
    makeModel: 'Togg T10X (AWD)',
    maxDcPowerKw: 180,
    architecture: '800V',
    batteryKwh: 88.5,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'ioniq-5',
    makeModel: 'Hyundai IONIQ 5',
    maxDcPowerKw: 235,
    architecture: '800V',
    batteryKwh: 77.4,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'ioniq-6',
    makeModel: 'Hyundai IONIQ 6',
    maxDcPowerKw: 240,
    architecture: '800V',
    batteryKwh: 77.4,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'kia-ev6',
    makeModel: 'Kia EV6',
    maxDcPowerKw: 240,
    architecture: '800V',
    batteryKwh: 77.4,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'tesla-model-3',
    makeModel: 'Tesla Model 3',
    maxDcPowerKw: 170,
    architecture: '400V',
    batteryKwh: 60,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'tesla-model-y',
    makeModel: 'Tesla Model Y',
    maxDcPowerKw: 175,
    architecture: '400V',
    batteryKwh: 60,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'vw-id4',
    makeModel: 'Volkswagen ID.4',
    maxDcPowerKw: 135,
    architecture: '400V',
    batteryKwh: 77,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'renault-zoe',
    makeModel: 'Renault Zoe',
    maxDcPowerKw: 50,
    architecture: '400V',
    batteryKwh: 52,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'byd-atto-3',
    makeModel: 'BYD Atto 3',
    maxDcPowerKw: 88,
    architecture: '400V',
    batteryKwh: 60.5,
    isPhev: false,
    connectorType: 'CCS2',
  },
  {
    id: 'nissan-leaf',
    makeModel: 'Nissan Leaf',
    maxDcPowerKw: 50,
    architecture: '400V',
    batteryKwh: 40,
    isPhev: false,
    connectorType: 'CHAdeMO',
  },
  {
    id: 'toyota-prius-phev',
    makeModel: 'Toyota Prius Plug-in Hybrid',
    maxDcPowerKw: 50,
    architecture: '400V',
    batteryKwh: 13.6,
    isPhev: true,
    connectorType: 'CCS2',
  },
  {
    id: 'mitsubishi-outlander-phev',
    makeModel: 'Mitsubishi Outlander PHEV',
    maxDcPowerKw: 22,
    architecture: '400V',
    batteryKwh: 20,
    isPhev: true,
    connectorType: 'CHAdeMO',
  },
];

export function findVehicleById(id: string): VehicleProfile | null {
  return vehicleFixtures.find((v) => v.id === id) ?? null;
}
