# OtoŞarj — Akıllı Soket Yönlendirme Middleware

## Ne
DC hızlı şarj istasyonlarında sürücüye yeni uygulama yükletmeden, operatörün
mevcut QR-okutma akışına giren bir karar motoru (middleware API). Sürücü
verimsiz bir soket seçtiğinde ("Nudge") mobil ekranda uyarı gösterir.

## Hedef ve bağlam
Kullanıcı, Eksim Holding'in şarj ağı markası **OtoPriz**'e staj başvurusu için
çalışan bir prototip + B2B fizibilite dosyası hazırlıyor. Detaylı araştırma
ve karar geçmişi: `.ai/DECISIONS.md`, iş/mevzuat bağlamı: `docs/technical/`
(Aşama 3'te yazılacak).

## Çözülen iki problem
1. **Power-sharing bilinçsizliği (ANA HİKÂYE, R1):** 180 kW paylaşımlı
   kabinde bir soket dolu, boş bağımsız kabin varken sürücü ikinci soketi
   seçiyor, güç yarıya bölünüyor.
2. **Kapasite uyumsuzluğu (İKİNCİL, R2):** Düşük güçlü araç, yüksek güçlü
   soketi işgal ediyor. Kural **oran-bazlı** (2x eşik), sabit bir kW
   rakamına bağlı değil — OtoPriz'de tavan 180 kW, büyük operatörlerde
   300 kW olabilir, motor ikisinde de aynı mantıkla çalışır.

## Tech stack
- **packages/engine**: saf TypeScript, framework-bağımsız, Vitest test'li.
  Gerçek IP burada — `decide()` fonksiyonu.
- **packages/server**: Node + Express + TS. Middleware API (`POST /scan`).
- **packages/web**: Vite + React + TS + Tailwind. İnteraktif simülatör.
- npm workspaces, monorepo aracı yok.

## Build/run/test
```
npm install                                    # kökten, tüm workspaces
npm run test --workspace=packages/engine       # motor testleri
npm run build --workspace=packages/engine      # tip kontrolü + derleme
npm run dev                                     # server + web birlikte (Aşama 1 tamamlanınca)
```

## Dizin yapısı
```
packages/engine/src/
  types.ts          — domain modeli (Station, Evse, PowerSharingGroup, Decision...)
  power.ts          — efektif güç hesabı
  chargeTime.ts      — taper modelli şarj süresi tahmini (+ EPDK %85 bayrağı)
  alternatives.ts    — en iyi alternatif soket bulma (Faz 1: aynı operatör kısıtı)
  operatorImpact.ts  — kWh/ciro etkisi hesabı
  suppression.ts     — R5, kısa TTL'li tekrar-uyarma engeli
  messages.ts        — sabit şablonlu sürücü mesajları (enjeksiyon engeli)
  decide.ts          — ANA KARAR MOTORU (R1→R5 sırasıyla)
  fixtures/          — OtoPriz sahası, büyük operatör sahası, araç DB'si
docs/business/        — Aşama 2: ROI, SWOT, pitch (henüz yazılmadı)
docs/technical/        — Aşama 3: mimari, OCPP/OCPI, mevzuat (henüz yazılmadı)
```

## Proje kısıtı
Bu proje **iki fazlı** tasarlandı. Faz 1 (bu repoda kodlanan) yalnızca
istasyon-içi, tek operatör, tek tarife. Çapraz-operatör/çapraz-saha
öneriler (Faz 2) bilinçli olarak kapsam dışı — gerekçe `.ai/DECISIONS.md`.
