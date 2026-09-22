# Mimari / Tasarım Kararları

## Güvenlik incelemesi — 22 Eylül 2026
Kod incelemesi + `npm audit` + git geçmişi taraması. Bulgular ciddiyete
göre `.ai/KNOWN_ISSUES.md`'de. Öne çıkanlar:
- **Cross-tenant yetki atlatma (düzeltildi):** `sessions.ts`
  (accept/decline-nudge) ve `simulate.ts` (start-session) `stationId`'nin
  çağıran `req.operatorId`'ye ait olup olmadığını kontrol ETMİYORDU —
  `/scan` ve `/live`'daki gibi bir izolasyon eksikti. Geçerli herhangi bir
  demo API key ile başka operatörün sahasına telemetri/suppression kaydı
  yazılabiliyor, simüle EVSE durumu değiştirilebiliyordu. Düzeltme: her
  ikisine de `station.operatorId !== req.operatorId` kontrolü eklendi
  (CsmsAdapter üzerinden), jenerik 400/404 ile enumeration korunuyor.
  Regresyon testleri eklendi (`app.test.ts`, 5 yeni test).
- **HTTP güvenlik header'ları eklendi:** `helmet()` (CSP, X-Frame-Options,
  X-Content-Type-Options, HSTS). Önceden hiç yoktu.
- **CORS daraltıldı:** `cors()` (tüm origin'lere açık) yerine
  `CORS_ALLOWED_ORIGINS` env değişkeninden okunan allowlist. Boşsa
  sadece localhost dev origin'leri. **Production'da bu env değişkeni
  sunucuda set edilmeli** (`.env.production.example`'a örnek eklendi:
  `https://otopriz.esadseyitoglu.xyz`). Not: web ve API aynı domainden
  serve edildiği için (bkz. deploy mimarisi) tarayıcıdan çapraz-origin
  istek riski zaten düşüktü, ama önceki hal açıkça yanlıştı.
- **HMAC/timing-safe/replay:** zaten doğruydu — `timingSafeEqual`
  kullanılıyor, 1 dakikalık timestamp penceresi var, `trust proxy: 1`
  doğru (tek Caddy hop'u, `af3b51d` ile düzeltilmişti, hâlâ doğru).
  Değişiklik yapılmadı.
- **SQL injection:** N/A, veritabanı yok (in-memory + JSON fixture).
- **XSS:** `driverMessage` sunucu şablonundan üretiliyor, React JSX
  default escape ediyor, `dangerouslySetInnerHTML` hiçbir yerde yok.
- **Secret geçmişi:** `packages/web/.env.production` bir ara commit
  edilmişti (`9bb5d9f` ile kaldırıldı) ama içeriği sadece
  `VITE_API_BASE_URL` (public hostname) idi — gerçek secret hiç git'e
  girmedi, blob içeriği doğrulandı. Zaten `.ai/KNOWN_ISSUES.md`'de
  belgeli bir "çözülmüş incident".
- **npm audit:** 1 critical + 1 high (vitest/vite/esbuild) — hepsi
  devDependency, production server bağımlılıkları (`express`, `cors`,
  `helmet`) temiz. Düzeltme major version bump gerektiriyor (vitest 2→3),
  riskli görülüp düzeltilmedi, sadece raporlandı (bkz. KNOWN_ISSUES).
- **Düzeltilmeyen/düşük öncelikli:** `simulate/reset` hâlâ operatör
  ayrımı yapmıyor (kasıtlı, tüm demo state'i sıfırlıyor — dokümante
  edilmiş davranış); istemci tarafında HMAC secret'in tarayıcıya
  gömülmesi zaten bilinen ve dokümante edilmiş bir prototip kısayolu.

## Presentation decisions — 22 September 2026
- Lead with the user's socket choice and a computed example outcome; keep API/CSMS terminology in optional technical context. No auto-opening welcome dialog.
- Do not present the internal throughput estimate as realized revenue. Field value must be validated with demand, acceptance and time-saving measurements.
- R2 filters candidates before scoring: strictly lower rated power and no loss in effective power. Filtering only the winning candidate could hide a suitable alternative.
- Prepared scenarios create fresh demo sessions; manual retries retain session-based suppression. This keeps examples reproducible without changing the production suppression rule.

## Operatör etkisi tahmini — koşullu geri ekleme (22 Eylül 2026)
Kullanıcı: sabit ciro rakamının tamamen kaldırılması "business sense"i
zayıflatıyor, bir tahmin göstermek staj değerlendirmesi açısından iyi olur.
`EngineLog`'a (`Kararın gerekçesi` paneli) `decision.operatorImpact`'ten
gelen kutu eklendi — ama iki koşulla:
1. **Sadece `verdict === 'NUDGE'` VE `kwhThroughputGainKwh > 0` iken görünür.**
   R2 senaryosunda (B) seçilen ve önerilen soketin efektif gücü aynı
   olabiliyor (ikisi de aracın kapasitesiyle sınırlı) — bu durumda gerçek
   kazanç "kapasitenin başka araca kalması", kWh farkı değil. Kutu o zaman
   otomatik gizleniyor; sıfır/anlamsız rakam gösterilmiyor.
2. Kutunun altında sabit dürüstlük notu: "Güç farkı × tahmini süre × tarife
   ile hesaplanır. Talep/doluluk modellenmez, sahada ölçülmüş bir rakam
   değildir." — README'deki "ölçülmedi" iddiasıyla tutarlı, rakamı gizlemek
   yerine bağlamla birlikte gösteriyoruz.
Playwright ile doğrulandı: Senaryo A (R1) → "+33.0 kWh · ~₺459" görünüyor;
Senaryo B (R2) → kutu görünmüyor (gerçek davranış, bug değil).

## Presentation review sonrası düzeltme — README ve marka dili (22 Eylül 2026)
Presentation review'u yapan ajan README'yi İngilizceye çevirmiş ve arayüzdeki
"OtoPriz Sahası" gibi etiketleri nötr isimlere ("Paylaşımlı kabin örneği")
değiştirmiş, muhtemelen marka/izin riskini azaltmak için. Kullanıcı kararı:
**bu geri alındı.** Gerekçe: hedef kitle (Eren Bey, OtoPriz ekibi) WhatsApp
üzerinden Türkçe olarak bilgilendirilecek — link tıklandığında karşılaştığı
sayfa da aynı dilde aynı sıcak anlatıyı sürdürmeli, tutarsızlık olmamalı.
README Türkçeye ve "OtoPriz'e özel hazırlanan çalışan prototip" tonuna
geri döndürüldü; `stationLayout.ts`'teki "OtoPriz Sahası" / "Büyük Operatör
Sahası" isimleri ve `DriverPhone.tsx`'teki "OtoPriz" marka adı da eski
haline getirildi.

**Korunanlar (bunlar gerçek iyileştirmeydi, geri alınmadı):**
- R2 filtresi (aşağıda), yanlış-pozitif önlemi
- `NudgeModal`'a `key` prop'u (senaryo değişince state sıfırlanması, gerçek bug fix)
- `WelcomeGuide`'ın native `<dialog>` + odak yönetimi
- UI'dan senaryo kartlarındaki sabit/başta hep aynı ciro rakamının kaldırılması
  (bkz. aşağıdaki "Operatör etkisi tahmini" kararı — tamamen kaldırılmadı,
  koşullu/dinamik hale getirildi)
- README'deki "Prototipin sınırları" listesi (Türkçeye çevrilerek taşındı)
- `PresentationHero` / `DecisionSummary` bileşenleri (linke tıklayan kişinin
  bağlamı hızlıca anlaması için)
- Footer'daki TurbineTwin linki (iki proje birlikte referans gösterilecek)

Kaynak: uzun bir planlama oturumu, tam gerekçeler plan dosyasında
(`C:\Users\Monster\.claude\plans\bir-b2b-saas-ve-hidden-balloon.md`).
Burada yalnızca kod üzerinde iz bırakan kararlar özetleniyor.

## 1. Donanım değil, yazılım middleware
180 kW kabin fiziksel olarak 180 kW'tır — problem güç problemi değil
**tahsis (allocation) problemi.** Retrofit soket başına on binlerce TL;
yazılım katmanı sıfır CAPEX ve aynı gün tüm filoya yayılır.

## 2. Araç profili DB'ye dayanır, canlı protokole değil
ISO 15118 ile aracın gerçek max gücü ancak kablo takıldıktan sonra
öğrenilir (ChargeParameterDiscovery). Nudge takmadan önce çıkmalı →
motor statik `VehicleProfile` fixture'ına dayanıyor.

## 3. `PowerSharingGroup` standart-dışı bir kavram
OCPP 2.0.1'de de OCPI 2.2'de de "hangi EVSE'ler aynı fiziksel güç
modülünü paylaşıyor" bilgisi yok. Bu proje bunu kendi ekliyor —
ürünün en özgün teknik katkısı, aynı zamanda en büyük entegrasyon
sürtünmesi (her sahada elle tanımlanmalı).

## 4. R2 kuralı ORAN-bazlı, sabit kW rakamına değil
Eşik `evse.ratedPowerKw / vehicle.maxDcPowerKw >= 2x`. "300 kW" planın
ilk taslağında örnekti; OtoPriz'de tavan 180 kW olduğu keşfedildikten
sonra kuralın sabit rakama değil orana bağlı olması netleşti — aynı
kod hem OtoPriz'in 120 kW soketinde hem büyük operatörün 300 kW
soketinde doğru çalışıyor (bkz. `decide.test.ts`, "oran-bazli, sabit
rakam degil" testi).

## 5. Faz 1: sadece aynı operatör, aynı tarife içinde öneri
`findBestAlternative` farklı `operatorId`'li soketi hiçbir zaman
önermez (test'le kanıtlı). Gerekçe: farklı tarifeli soket önerisi
fiyat itirazı açar ve çapraz-operatör veri paylaşımı gerektirir —
bu Faz 2 kapsamında, bilinçli olarak ertelendi.

## 6. Motor stateless, suppression (R5) kısa TTL'li
`decide()` yan etkisiz saf fonksiyon. Tek "hafıza" ihtiyacı olan R5
kuralı da dışarıdan `suppressionHistory` olarak veriliyor, motor
kendi state tutmuyor. Kayıtlar pseudonim `sessionId` taşıyor,
plaka/VIN/isim yok (KVKK veri minimizasyonu, bkz. plan Güvenlik G2).

## 7. Güvenlik: read-only CSMS adapter (G1)
Planlanan `CsmsAdapter` interface'i yalnızca read metodları içerecek
şekilde tasarlanacak — middleware şarj başlatmaz/durdurmaz. Bu,
"ele geçirilse bile kritik altyapıyı bozamaz" argümanının kod
seviyesindeki karşılığı.

## 8. Mesajlar sunucu şablonundan, istemci girdisi karışmıyor
`messages.ts` — enjeksiyon riskini (G4) baştan kapatıyor. Ton da
bilinçli: "yanlış seçtiniz" değil "bilginiz olsun, tercih sizin" —
sürücü bilerek seçmiş olabilir (fiyat, park yeri, kısa mola).

## 9. Tek dosya değil, ayrık paket mimarisi
Gemini'nin "tek dosyalık React" önerisi reddedildi — tek dosya demo
yapar, ürün göstermez. `engine` paketinin framework-bağımsız ve
test'li olması, "gerçekten entegre edilebilir mi" sorusuna kanıtla
cevap veriyor.

## 10. Demo, sunucusuz statik değil — kullanıcının kendi sunucusunda gerçek API'ye bağlı
İlk planlanan "engine'i tarayıcıda çalıştır, sunucusuz statik host"
yaklaşımı terk edildi — kullanıcının kendi sunucusu (Debian 12,
esadseyitoglu.xyz) olduğu ortaya çıkınca gerçek bir middleware API'ye
bağlı demo kurmak hem daha güçlü bir kanıt (gerçek HTTP + HMAC akışı)
hem de mümkün oldu. Mimari: systemd servisi (server) + Caddy statik
dosya + reverse proxy (mevcut Docker Caddy container'ına yeni bir
Caddyfile bloğu eklendi, diğer servislere dokunulmadı). Detay:
`.ai/STATE.md` "Deploy mimarisi".

## 11. Subdomain adı: otopriz (kullanıcı kararı), otosarj değil
İlk kurulum `otosarj.esadseyitoglu.xyz` olarak yapılmıştı; kullanıcı
Cloudflare'de bilerek `otopriz` ekledi çünkü hedef kitleye (OtoPriz'e)
daha net hitap ediyor. Caddyfile ve web `.env.production` buna göre
güncellendi. Proje/repo adı hâlâ "otosarj" (GitHub, dizin adı) — sadece
canlı demo linki `otopriz` kullanıyor.
