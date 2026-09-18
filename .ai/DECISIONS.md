# Mimari / Tasarım Kararları

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
