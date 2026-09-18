/**
 * Demo/test amacli mock CSMS adapter. Gercek bir OCPP/OCPI baglantisi
 * yerine engine fixture'larini dondurur. Sahadaki canli durum
 * (sim-* endpoint'leri araciligiyla) bellekte degistirilebilir -- bu
 * simulatorun "1A'da sarj baslat" gibi senaryo butonlarini besler.
 */
import { otoprizStation, largeOperatorStation, type Station } from '@otosarj/engine';
import type { CsmsAdapter } from './CsmsAdapter.js';

// Derin kopya ile baslangic durumunu koru -- mutasyonlar bellek-ici state'i etkiler.
function cloneStation(station: Station): Station {
  return JSON.parse(JSON.stringify(station)) as Station;
}

export class MockCsmsAdapter implements CsmsAdapter {
  private readonly stations: Map<string, Station>;
  private readonly operatorStationIds: Map<string, string[]>;

  constructor() {
    this.stations = new Map([
      [otoprizStation.id, cloneStation(otoprizStation)],
      [largeOperatorStation.id, cloneStation(largeOperatorStation)],
    ]);
    this.operatorStationIds = new Map([
      ['otopriz', [otoprizStation.id]],
      ['buyuk-operator', [largeOperatorStation.id]],
    ]);
  }

  async getStation(stationId: string): Promise<Station | null> {
    const station = this.stations.get(stationId);
    return station ? cloneStation(station) : null;
  }

  async listStationIds(operatorId: string): Promise<string[]> {
    return this.operatorStationIds.get(operatorId) ?? [];
  }

  /**
   * Demo/simulasyon amacli -- CsmsAdapter interface'inin PARCASI DEGIL.
   * Gercek bir CSMS'te bu metod olmaz; sadece bu mock'ta simulatorun
   * saha durumunu degistirebilmesi icin var.
   */
  _simSetEvseStatus(
    stationId: string,
    evseId: string,
    status: Station['evses'][number]['status'],
    liveDrawKw: number | null
  ): boolean {
    const station = this.stations.get(stationId);
    if (!station) return false;
    const evse = station.evses.find((e) => e.id === evseId);
    if (!evse) return false;
    evse.status = status;
    evse.liveDrawKw = liveDrawKw;
    return true;
  }

  _simReset(): void {
    this.stations.set(otoprizStation.id, cloneStation(otoprizStation));
    this.stations.set(largeOperatorStation.id, cloneStation(largeOperatorStation));
  }
}
