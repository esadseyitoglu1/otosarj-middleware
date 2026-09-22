# Mevcut Durum

Son güncelleme: 22 Eylül 2026

## Tamamlanan paketler

- **packages/engine — 30/30 test yeşil.** R1–R5 kuralları, iki saha
  fixture'ı, taper modelli süre tahmini. Framework bağımsız saf TypeScript;
  karar motoru burada, arayüzde değil.
- **packages/server — 20/20 test yeşil.** HMAC imzalı API
  (`POST /api/v1/scan` vb.), rate limit, input validation, read-only CSMS
  adapter, pseudonim + agrege telemetri, operatörler arası izolasyon.
- **packages/web — tamamlandı.** Vite + React + Tailwind simülatör.
  StationMap, DriverPhone, NudgeModal, EngineLog, ScenarioBar (3 hazır
  senaryo). Tarayıcıda Web Crypto ile HMAC imzalıyor — prototip kısayolu,
  gerekçesi `api/client.ts` içindeki yorumda.

Canlı demo: https://otopriz.esadseyitoglu.xyz

## Son dönemdeki değişiklikler

### Güvenlik incelemesi (22 Eylül 2026)
Savunma amaçlı bir kod incelemesi yapıldı. İki gerçek yetki-atlatma açığı
bulundu ve kapatıldı: `sessions.ts` (accept/decline-nudge) ve `simulate.ts`
(start-session) uçları `stationId`'nin çağıran operatöre ait olup olmadığını
kontrol etmiyordu. Her ikisine `operatorId` eşleşme kontrolü + ID
validasyonu eklendi, 5 regresyon testiyle kilitlendi. Ayrıca Helmet ile HTTP
güvenlik başlıkları ve CORS allowlist eklendi. Gerekçeler: `DECISIONS.md`.

Production'da doğrulandı: güvenlik başlıkları dönüyor, cross-tenant istek
400 ile reddediliyor, kendi saha işlemi 200 dönüyor, senaryolarda regresyon
yok.

### Operatör etkisi metrikleri
`EngineLog` iki ayrı kazanç kanalını koşullu gösteriyor:
- **R1 →** `kwhThroughputGainKwh` (aynı sürede satılabilecek ek kWh)
- **R2 →** `freedCapacityKw` (boşalan yüksek güçlü soketin kapasitesi)

İkisi de "tahmini, sahada ölçülmedi" notuyla sunuluyor. Gerekçe:
`DECISIONS.md`.

### Sunum hazırlığı
`PresentationHero` ve `DecisionSummary` bileşenleri eklendi (linke tıklayan
kişinin bağlamı hızlı anlaması için), `WelcomeGuide` native `<dialog>` +
odak yönetimine geçirildi, `NudgeModal`'a `key` prop'u eklendi (senaryo
değişince modal state'i sıfırlanıyor). Sayfa altına teknik yaklaşım ve
güvenlik özeti eklendi.

Playwright ile 7 ekran görüntüsü alınarak görsel doğrulama yapıldı (hero,
dialog, senaryo A/B/C, teknik detaylar, mobil 390px) — console/page hatası
yok.

## Deploy

Kod akışı: `git push origin main` (GitHub) ve `git push deploy main`
(sunucudaki bare repo). Sunucudaki `post-receive` hook checkout yapıyor,
**ama build/restart otomatik değil** — her deploy'da elle:

```
cd /opt/otosarj
npm install
npm run build --workspace=packages/engine
npm run build --workspace=packages/server
npm run build --workspace=packages/web
cp -r packages/web/dist/* /srv/otosarj/
systemctl restart otosarj.service
```

Servis systemd altında (port 3001, yalnızca localhost), statik dosyalar
Caddy `file_server` ile, reverse proxy paylaşımlı bir Caddy container'ı
üzerinden, HTTPS Let's Encrypt ile otomatik.

**Secret yönetimi:** secret'lar yalnızca sunucudaki `.env` dosyalarında
(`OTOSARJ_DEMO_HMAC_SECRET` ve karşılığı olan `VITE_DEMO_HMAC_SECRET`).
Bu iki değer birbiriyle eşleşmeli. Repoda secret yok, yalnızca
`.env.production.example` şablonu var. Geçmişte bu konuda yaşanan bir
incident ve alınan ders: `KNOWN_ISSUES.md`.

## Henüz yapılmadı

- `docs/business/`: ROI modeli, SWOT, pitch deck
- `docs/technical/`: mimari, OCPP/OCPI entegrasyon dokümanı, mevzuat
  analizi, SECURITY.md, PRIVACY.md
- Otomatik deploy (CI/CD) yok — her değişiklik elle build+restart gerektiriyor
