import { describe, expect, it } from 'vitest';
import { computeEffectivePower } from './power.js';
import type { Evse, PowerSharingGroup, VehicleProfile } from './types.js';

const vehicle = (maxDcPowerKw: number): VehicleProfile => ({
  id: 'v1',
  makeModel: 'Test Vehicle',
  maxDcPowerKw,
  architecture: '400V',
  batteryKwh: 60,
  isPhev: false,
  connectorType: 'CCS2',
});

const evse = (overrides: Partial<Evse> = {}): Evse => ({
  id: '1A',
  ratedPowerKw: 180,
  connectorType: 'CCS2',
  status: 'available',
  liveDrawKw: null,
  powerSharingGroupId: null,
  walkingDistanceM: 0,
  tariffTlPerKwh: 13.9,
  operatorId: 'otopriz',
  ...overrides,
});

const group = (overrides: Partial<PowerSharingGroup> = {}): PowerSharingGroup => ({
  id: 'cabinet-1',
  cabinetMaxPowerKw: 180,
  evseIds: ['1A', '1B'],
  sharingMode: 'equal-split',
  ...overrides,
});

describe('computeEffectivePower', () => {
  it('arac-limitli: soket ve kabin yeterince guclu ama arac sinirlayici', () => {
    const result = computeEffectivePower(evse(), null, vehicle(50), []);
    expect(result).toBe(50);
  });

  it('soket-limitli: arac cok guclu ama soketin nominal gucu sinirlayici', () => {
    const result = computeEffectivePower(
      evse({ ratedPowerKw: 120 }),
      null,
      vehicle(300),
      []
    );
    expect(result).toBe(120);
  });

  it('kabin-limitli: paylasimli grupta komsu soket dolu, guc bolunuyor', () => {
    const result = computeEffectivePower(
      evse({ ratedPowerKw: 180, powerSharingGroupId: 'cabinet-1' }),
      group(),
      vehicle(300),
      ['1B'] // komsu sarj halinde
    );
    expect(result).toBe(90); // 180 / 2
  });

  it('paylasimli grupta komsu bosken tam kabin gucu alinir', () => {
    const result = computeEffectivePower(
      evse({ ratedPowerKw: 180, powerSharingGroupId: 'cabinet-1' }),
      group(),
      vehicle(300),
      [] // komsu bos
    );
    expect(result).toBe(180);
  });

  it('uc darbogazin en dusugu secilir (kabin bolunmus + arac sinirli)', () => {
    const result = computeEffectivePower(
      evse({ ratedPowerKw: 180, powerSharingGroupId: 'cabinet-1' }),
      group(),
      vehicle(50), // arac 90 kW'dan da dusuk cekebiliyor
      ['1B']
    );
    expect(result).toBe(50);
  });
});
