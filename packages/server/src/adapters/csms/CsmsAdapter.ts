/**
 * CSMS adapter interface.
 *
 * GUVENLIK KARARI G1 (en onemli mimari kisit -- bkz. plan "Guvenlik & Mahremiyet"):
 * Bu interface KASITLI OLARAK sadece READ metodlari icerir. Middleware
 * operatorun CSMS'ine hicbir sekilde yazmaz -- sarj baslatmaz, durdurmaz,
 * guc limiti degistirmez, tarife degistirmez. Sadece okur ve oneri doner.
 *
 * Bu sinir konfigurasyonla degil, TIP SEVIYESINDE dayatiliyor: interface'e
 * bakan herhangi bir gelistirici write metodu olmadigini gorur. Gercek bir
 * CSMS entegrasyonu yapilacaksa, bu interface'i implement eden yeni bir
 * adapter (orn. OcppCsmsAdapter) yazilir -- ama o da bu interface'e bagli
 * kaldigi surece write yapamaz.
 *
 * "Ele gecirilse bile kimse sarjinizi durduramaz, gucunuzu degistiremez."
 */
import type { Station } from '@otosarj/engine';

export interface CsmsAdapter {
  /** Belirtilen sahanin GUNCEL topolojisini ve canli durumunu doner. */
  getStation(stationId: string): Promise<Station | null>;

  /** Operatorun yetkili oldugu tum saha kimliklerini doner. */
  listStationIds(operatorId: string): Promise<string[]>;
}
