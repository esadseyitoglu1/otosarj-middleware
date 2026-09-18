import { describe, expect, it } from 'vitest';
import { findBestAlternative } from './alternatives.js';
import type { Evse, Station, VehicleProfile } from './types.js';

const vehicle = (overrides: Partial<VehicleProfile> = {}): VehicleProfile => ({
  id: 'v1',
  makeModel: 'Test Vehicle',
  maxDcPowerKw: 250,
  architecture: '800V',
  batteryKwh: 77,
  isPhev: false,
  connectorType: 'CCS2',
  ...overrides,
});

const baseEvse = (overrides: Partial<Evse>): Evse => ({
  id: 'x',
  ratedPowerKw: 120,
  connectorType: 'CCS2',
  status: 'available',
  liveDrawKw: null,
  powerSharingGroupId: null,
  walkingDistanceM: 10,
  tariffTlPerKwh: 13.9,
  operatorId: 'otopriz',
  ...overrides,
});

describe('findBestAlternative', () => {
  it('farkli operatorun soketi asla onerilmez (Faz 1 kisiti)', () => {
    const station: Station = {
      id: 's1',
      name: 'Test',
      operatorId: 'otopriz',
      powerSharingGroups: [],
      evses: [
        baseEvse({ id: 'selected', status: 'charging' }),
        baseEvse({
          id: 'rival-operator-evse',
          status: 'available',
          ratedPowerKw: 300,
          operatorId: 'rakip-operator', // farkli operator
          walkingDistanceM: 5,
        }),
      ],
    };

    const result = findBestAlternative(station, vehicle(), 'selected');
    expect(result).toBeNull();
  });

  it('konnektor uyumsuz soket onerilmez', () => {
    const station: Station = {
      id: 's1',
      name: 'Test',
      operatorId: 'otopriz',
      powerSharingGroups: [],
      evses: [
        baseEvse({ id: 'selected' }),
        baseEvse({ id: 'chademo-evse', connectorType: 'CHAdeMO' }),
      ],
    };

    const result = findBestAlternative(station, vehicle({ connectorType: 'CCS2' }), 'selected');
    expect(result).toBeNull();
  });

  it('dolu soketler alternatif olarak onerilmez', () => {
    const station: Station = {
      id: 's1',
      name: 'Test',
      operatorId: 'otopriz',
      powerSharingGroups: [],
      evses: [
        baseEvse({ id: 'selected' }),
        baseEvse({ id: 'busy-evse', status: 'charging' }),
      ],
    };

    const result = findBestAlternative(station, vehicle(), 'selected');
    expect(result).toBeNull();
  });

  it('birden fazla uygun aday varsa en yuksek efektif guclu (mesafe cezali) secilir', () => {
    const station: Station = {
      id: 's1',
      name: 'Test',
      operatorId: 'otopriz',
      powerSharingGroups: [],
      evses: [
        baseEvse({ id: 'selected' }),
        baseEvse({ id: 'near-low', ratedPowerKw: 60, walkingDistanceM: 2 }),
        baseEvse({ id: 'far-high', ratedPowerKw: 180, walkingDistanceM: 20 }),
      ],
    };

    const result = findBestAlternative(station, vehicle(), 'selected');
    expect(result?.evse.id).toBe('far-high');
  });
});
