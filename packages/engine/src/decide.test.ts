import { describe, expect, it } from 'vitest';
import { decide } from './decide.js';
import { otoprizStation } from './fixtures/station-otopriz.js';
import { largeOperatorStation } from './fixtures/station-large-operator.js';
import { findVehicleById } from './fixtures/vehicles.js';
import { createSuppressionRecord } from './suppression.js';
import type { ScanInput, SuppressionRecord } from './types.js';

const baseInput = (overrides: Partial<ScanInput> = {}): ScanInput => ({
  sessionId: 'session-abc123',
  stationId: otoprizStation.id,
  scannedEvseId: '1B',
  vehicleProfileId: 'togg-t10x-rwd',
  currentSocPercent: 20,
  ...overrides,
});

describe('decide - R1 power-sharing (OtoPriz senaryosu A)', () => {
  it('1A dolu, 1B secildi, 2A/2B bos -> NUDGE ile 2A veya 2B onerilir', () => {
    const vehicle = findVehicleById('togg-t10x-rwd')!;
    const result = decide({
      input: baseInput(),
      station: otoprizStation,
      vehicle,
      suppressionHistory: [],
    });

    expect(result.verdict).toBe('NUDGE');
    expect(result.triggeredRule).toBe('R1');
    expect(result.selected.effectivePowerKw).toBe(90); // 180/2, 1A dolu oldugu icin
    expect(result.recommended).not.toBeNull();
    expect(['2A', '2B']).toContain(result.recommended!.evseId);
    expect(result.recommended!.effectivePowerKw).toBe(180);
    expect(result.driverMessage).toContain('Tercih sizin');
    expect(result.operatorImpact.kwhThroughputGainKwh).toBeGreaterThan(0);
  });

  it('paylasimli grupta komsu soket BOSSA nudge verilmemeli', () => {
    // 1A'yi de bosa cekelim (senaryo disi durum testi)
    const stationWithBothEmpty = {
      ...otoprizStation,
      evses: otoprizStation.evses.map((e) =>
        e.id === '1A' ? { ...e, status: 'available' as const, liveDrawKw: null } : e
      ),
    };
    const vehicle = findVehicleById('togg-t10x-rwd')!;
    const result = decide({
      input: baseInput(),
      station: stationWithBothEmpty,
      vehicle,
      suppressionHistory: [],
    });

    expect(result.verdict).toBe('PROCEED');
    expect(result.selected.effectivePowerKw).toBe(180);
  });
});

describe('decide - R2 kapasite asiri-tahsisi', () => {
  it('PHEV (50 kW) + 300 kW soket (buyuk operator sahasi) -> NUDGE', () => {
    const vehicle = findVehicleById('toyota-prius-phev')!;
    const result = decide({
      input: baseInput({
        stationId: largeOperatorStation.id,
        scannedEvseId: 'ultra-1',
      }),
      station: largeOperatorStation,
      vehicle,
      suppressionHistory: [],
    });

    expect(result.verdict).toBe('NUDGE');
    expect(result.triggeredRule).toBe('R2');
    expect(result.selected.effectivePowerKw).toBe(50); // arac limitli
    expect(result.recommended).not.toBeNull();
  });

  it('OtoPriz sahasinda 50 kW arac 120 kW sokete takarsa da R2 tetiklenir (oran-bazli, sabit rakam degil)', () => {
    // Bu test, R2'nin "300 kW" gibi sabit bir sayiya degil,
    // soket/arac oranina dayandigini kanitlar -- kullanici notu:
    // "300 bir ornekti, muhabbet az cekenin cok vereni isgali".
    const vehicle = findVehicleById('toyota-prius-phev')!; // 50 kW
    const result = decide({
      input: baseInput({ scannedEvseId: '3' }), // 120 kW bagimsiz soket
      station: otoprizStation,
      vehicle,
      suppressionHistory: [],
    });

    expect(result.verdict).toBe('NUDGE');
    expect(result.triggeredRule).toBe('R2');
  });

  it('alternatif yoksa (hepsi dolu/uyumsuz) nudge verilmemeli -- bosuna rahatsiz etmeme', () => {
    const allBusyStation = {
      ...largeOperatorStation,
      evses: largeOperatorStation.evses.map((e) =>
        e.id === 'ultra-1' ? e : { ...e, status: 'charging' as const }
      ),
    };
    const vehicle = findVehicleById('toyota-prius-phev')!;
    const result = decide({
      input: baseInput({
        stationId: largeOperatorStation.id,
        scannedEvseId: 'ultra-1',
      }),
      station: allBusyStation,
      vehicle,
      suppressionHistory: [],
    });

    expect(result.verdict).toBe('PROCEED');
  });
});

describe('decide - R3 konnektor uyumsuzlugu', () => {
  it('CHAdeMO araci CCS2 sokete BLOCK doner', () => {
    const vehicle = findVehicleById('nissan-leaf')!; // CHAdeMO
    const result = decide({
      input: baseInput({ scannedEvseId: '1B' }), // CCS2
      station: otoprizStation,
      vehicle,
      suppressionHistory: [],
    });

    expect(result.verdict).toBe('BLOCK');
    expect(result.triggeredRule).toBe('R3');
  });
});

describe('decide - R4 negatif senaryo (yanlis-pozitif kontrolu)', () => {
  it('IONIQ 5 + bos 180 kW soket -> PROCEED, motor sessiz kalir', () => {
    const vehicle = findVehicleById('ioniq-5')!; // 235 kW
    const emptyStation = {
      ...otoprizStation,
      evses: otoprizStation.evses.map((e) =>
        e.id === '1A' ? { ...e, status: 'available' as const, liveDrawKw: null } : e
      ),
    };
    const result = decide({
      input: baseInput({ scannedEvseId: '2A' }),
      station: emptyStation,
      vehicle,
      suppressionHistory: [],
    });

    expect(result.verdict).toBe('PROCEED');
    expect(result.triggeredRule).toBeNull();
  });
});

describe('decide - R5 suppression', () => {
  it('ayni uyari daha once reddedildiyse tekrar gosterilmez', () => {
    const vehicle = findVehicleById('togg-t10x-rwd')!;
    const input = baseInput();

    const history: SuppressionRecord[] = [
      createSuppressionRecord(input.sessionId, otoprizStation.id, '1B', 'R1'),
    ];

    const result = decide({
      input,
      station: otoprizStation,
      vehicle,
      suppressionHistory: history,
    });

    expect(result.verdict).toBe('PROCEED');
    expect(result.reasoning.some((r) => r.includes('R5'))).toBe(true);
  });

  it('farkli bir sessionId icin suppression gecerli olmamali', () => {
    const vehicle = findVehicleById('togg-t10x-rwd')!;
    const history: SuppressionRecord[] = [
      createSuppressionRecord('baska-oturum', otoprizStation.id, '1B', 'R1'),
    ];

    const result = decide({
      input: baseInput({ sessionId: 'session-abc123' }),
      station: otoprizStation,
      vehicle,
      suppressionHistory: history,
    });

    expect(result.verdict).toBe('NUDGE');
  });
});

describe('decide - arac profili eksik', () => {
  it('vehicleProfileId yoksa motor R1/R2 degerlendirmez, sadece PROCEED doner', () => {
    const result = decide({
      input: baseInput(),
      station: otoprizStation,
      vehicle: null,
      suppressionHistory: [],
    });

    expect(result.verdict).toBe('PROCEED');
    expect(result.triggeredRule).toBeNull();
  });
});

describe('decide - bilinmeyen EVSE (savunmaci davranis)', () => {
  it('olmayan bir evseId ile cagrilirsa crash etmez, PROCEED doner', () => {
    const vehicle = findVehicleById('togg-t10x-rwd')!;
    const result = decide({
      input: baseInput({ scannedEvseId: 'olmayan-soket-999' }),
      station: otoprizStation,
      vehicle,
      suppressionHistory: [],
    });

    expect(result.verdict).toBe('PROCEED');
  });
});
