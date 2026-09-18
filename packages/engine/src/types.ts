/**
 * Domain types - OtoPriz akilli soket yonlendirme motoru.
 *
 * Hiyerarsi OCPP/OCPI standardina sadik: Station -> Evse -> Connector.
 * Tek yeni kavram bizim eklediklerimiz: PowerSharingGroup.
 * Bu, OCPP 2.0.1'de de OCPI 2.2'de de karsiligi olmayan bir alan --
 * hangi EVSE'lerin ayni fiziksel guc modulunu paylastigi bilgisi
 * hicbir standartta tanimli degil. Bkz. docs/technical/OCPP_OCPI_INTEGRATION.md
 */

export type ConnectorType = 'CCS2' | 'CHAdeMO' | 'Type2';

export type EvseStatus = 'available' | 'charging' | 'faulted' | 'reserved';

export type VehicleArchitecture = '400V' | '800V';

/**
 * Ayni fiziksel guc modulunu / kabini paylasan EVSE'leri grupluyor.
 * Ornek: 180 kW'lik bir kabin, 1A ve 1B soketlerini equal-split ile paylasir.
 *
 * ONEMLI: Bu veri operatorun CSMS'inde de standart bir alan olarak
 * bulunmuyor olabilir -- sahada elle tanimlanmasi gerekir. Bkz. KNOWN_ISSUES.
 */
export interface PowerSharingGroup {
  id: string; // "cabinet-1"
  cabinetMaxPowerKw: number; // 180
  evseIds: string[]; // ["1A", "1B"]
  sharingMode: 'equal-split' | 'dynamic-allocation';
}

export interface Evse {
  id: string; // "1A"
  ratedPowerKw: number; // sokedin nominal (kabin sinirindan bagimsiz) gucu
  connectorType: ConnectorType;
  status: EvseStatus;
  liveDrawKw: number | null; // status === 'charging' ise anlik cekilen guc
  powerSharingGroupId: string | null; // null ise bagimsiz soket
  walkingDistanceM: number; // "5 metre yaninizdaki" mesaji icin, referans noktasina gore
  tariffTlPerKwh: number; // Faz 2 capraz-operator fiyat karsilastirmasi icin hazir
  operatorId: string; // Faz 2 capraz-operator filtrelemesi icin hazir (Faz 1'de hep ayni)
}

export interface Station {
  id: string;
  name: string;
  operatorId: string;
  evses: Evse[];
  powerSharingGroups: PowerSharingGroup[];
}

export interface VehicleProfile {
  id: string;
  makeModel: string; // "Toyota Prius Plug-in Hybrid"
  maxDcPowerKw: number; // aracin fiziksel olarak cekebilecegi azami DC guc
  architecture: VehicleArchitecture;
  batteryKwh: number;
  isPhev: boolean;
  connectorType: ConnectorType;
}

/**
 * Karar motorunun girdisi. userId burada KASITLI OLARAK pseudonim/opak bir
 * kimlik olarak modellenir -- motor gercek kullanici kimligine ihtiyac
 * duymaz, sadece ayni oturumun tekrar eden istekleri oldugunu bilmesi
 * yeterlidir (R5 suppression icin). Bkz. Guvenlik G2.
 */
export interface ScanInput {
  sessionId: string; // pseudonim oturum kimligi -- plaka/VIN/kimlik ASLA burada degil
  stationId: string;
  scannedEvseId: string;
  vehicleProfileId: string | null; // profil yoksa motor R1/R2'yi degerlendiremez, sadece R3 calisir
  currentSocPercent: number; // 0-100
}

export type DecisionVerdict = 'PROCEED' | 'NUDGE' | 'BLOCK';

export type TriggeredRule = 'R1' | 'R2' | 'R3' | 'R5' | null;

export interface ChargeEstimate {
  evseId: string;
  effectivePowerKw: number;
  estMinutesTo80: number;
}

export interface RecommendedChargeEstimate extends ChargeEstimate {
  walkingDistanceM: number;
}

export interface OperatorImpact {
  kwhThroughputGainKwh: number;
  revenueOpportunityTl: number;
}

export type DeclineReason = 'parking' | 'price' | 'short-stop' | 'other';

/**
 * Motorun tek cikti tipi. Her zaman aciklanabilir: reasoning[] alani
 * demo panelinde ("EngineLog") adim adim gosterilir -- kara kutu degil.
 */
export interface Decision {
  verdict: DecisionVerdict;
  triggeredRule: TriggeredRule;
  selected: ChargeEstimate;
  recommended: RecommendedChargeEstimate | null;
  driverMessage: string; // Turkce, sunucu sablonundan uretilir (bkz. Guvenlik G4)
  operatorImpact: OperatorImpact;
  reasoning: string[];
}

/** R5 suppression icin kisa-omurlu kayit. TTL ile silinir (bkz. Guvenlik G2). */
export interface SuppressionRecord {
  sessionId: string;
  stationId: string;
  evseId: string;
  triggeredRule: TriggeredRule;
  expiresAtMs: number;
}
