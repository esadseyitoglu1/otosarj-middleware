# OtoŞarj — Akıllı Soket Yönlendirme Middleware

Sürücüye yeni bir uygulama yükletmeden, DC hızlı şarj istasyonlarındaki
**verimsiz soket seçimlerini** anında tespit edip "Nudge" (yönlendirme)
öneren bir karar motoru ve middleware API prototipi.

**🔗 Canlı demo:** https://otopriz.esadseyitoglu.xyz
**🔗 Diğer proje:** [TurbineTwin](http://turbinetwin.esadseyitoglu.xyz) — rüzgar türbini anomali tespiti

> **Bağlam:** Bu proje, Türkiye'deki şarj ağı operatörü **OtoPriz**'e
> (Eksim Holding) staj başvurusu için hazırlanan çalışan bir prototiptir.
> Amaç, sahada gerçekten yaşanan iki verimsizliği somut kodla göstermek.
>
> API ve karar motoru gerçek ve çalışıyor; saha durumu (soket doluluğu,
> canlı güç) simüle edilmiş, araç profilleri örnek amaçlı, şarj süresi
> tahminleri basitleştirilmiş bir modele dayanıyor. Bu resmi bir OtoPriz
> ürünü ya da canlı bir operatör entegrasyonu değil — OtoPriz'in gerçek
> sahasına bağlanmaya hazır bir prototip.

---

## Problem

DC hızlı şarj sahalarında iki tekrarlayan verimsizlik var:

1. **Power-sharing bilinçsizliği (ana senaryo).** 180 kW'lık paylaşımlı
   bir kabinde (örn. soket 1A ve 1B) bir araç şarj olurken, yandaki
   tamamen boş bir kabin dururken, yeni gelen sürücü aynı kabinin diğer
   soketine takıyor. Güç anında ikiye bölünüyor (90+90 kW) — iki araç da
   yavaşlıyor, kimse kazanmıyor.

2. **Kapasite uyumsuzluğu.** Düşük güçte şarj olabilen bir araç (örn. bir
   PHEV, max 50 kW), çok daha yüksek güçlü bir soketi işgal ediyor. Araç
   zaten fazlasını çekemediği için, yandaki daha düşük güçlü boş soket
   **tam aynı sürede** aynı işi görürdü — ama o soket artık yüksek
   kapasiteli bir araç bekleyen kuyruğa kapalı.

Sürücü bunların hiçbirini bilerek yapmıyor — çünkü hiçbir uygulama ona
söylemiyor. Sektörde bu problemi çözen bir ürün bulunamadı: OCPP 2.0.1
*güç limitlemeyi* çözüyor, *soket seçimini* çözmüyor.

Bu iki senaryo kurgusal değil — bir sürücünün Bolu Highway'de yaşadığı
tam bu iki deneyimi anlattığı kamuoyu videosu:
[*"Elektrikli araç kullanma kültürü hala oturamadı"*](https://youtube.com/shorts/aqu1IQ80lGM) (Taha Hüseyin Karagöz).

## Çözüm

Sürücü operatörün **kendi** uygulamasından bir soketin QR kodunu
okuttuğunda, bu middleware kullanıcının araç profilini, seçilen soketin
durumunu ve sahadaki diğer soketlerin canlı yükünü analiz eder. Seçim
verimsizse, ekranda kullanıcı dostu bir öneri belirir — sürücü isterse
kabul eder, isterse mevcut seçimiyle devam eder. **Zorlama yok, sıfır
ekstra uygulama, sıfır donanım değişikliği.**

Potansiyel fayda daha kısa şarj süreleri ve daha iyi kapasite dağılımı;
**ne saha tasarrufu ne de ek ciro şu ana kadar ölçülmedi** — bu aşağıda
dürüstçe belirtiliyor.

## Bir dakikada deneyin

1. **"Örneği çalıştır"**a ya da **A** senaryosuna tıklayın. Sürücü,
   dolu ve güç-paylaşımlı bir kabinin ikinci soketini seçerken, yan
   kabin tamamen boş.
2. Sonucu okuyun: seçilen vs. önerilen güç, tahmini süre farkı, önerilen
   soket. Saha haritası ve telefon aynı kararı gösterir.
3. **B**'yi deneyin: düşük güçlü bir araç, aynı tahmini hızda daha düşük
   güçlü bir sokete yönlendirilir; yüksek kapasiteli ekipman serbest kalır.
4. **C**'yi deneyin: seçim zaten uygunsa motor gereksiz uyarı vermez.

Her hazır senaryo temiz bir demo oturumuyla başlar. Öneriyi kabul/reddedebilir,
araç ve şarj seviyesi seçip boş bir soketi kendiniz de okutabilirsiniz.
Teknik gerekçe "Teknik karar adımları" panelinde adım adım görünür.

---

## Mimari

```
┌─────────────────────┐      QR okutma       ┌──────────────────────┐
│  Operatör uygulaması │ ───────────────────► │   packages/server    │
│  (OtoPriz vb.)       │ ◄─────────────────── │   POST /api/v1/scan  │
└─────────────────────┘      Decision JSON    └───────────┬──────────┘
                                                            │
                                                            ▼
                                                ┌──────────────────────┐
                                                │   packages/engine    │
                                                │   decide() — saf,    │
                                                │   framework-bağımsız │
                                                │   karar motoru       │
                                                └──────────────────────┘
                                                            │
                                                  read-only │ (CsmsAdapter)
                                                            ▼
                                                ┌──────────────────────┐
                                                │   Operatörün CSMS'i   │
                                                │   (yazılmaz, sadece   │
                                                │    okunur)            │
                                                └──────────────────────┘
```

- **`packages/engine`** — Bu projenin gerçek IP'si. Saf TypeScript, hiçbir
  framework'e bağımlı değil, tamamen unit-test'li. `decide()` fonksiyonu
  bir `ScanInput` alır, açıklanabilir bir `Decision` döner.
- **`packages/server`** — Express tabanlı API katmanı. İmzalı demo istekleri,
  doğrulama, rate limit, read-only adapter arayüzü, tercih telemetrisi.
  Operatörün mevcut QR akışına takılacak `POST /api/v1/scan` uç noktasını sunar.
- **`packages/web`** — İnteraktif simülatör. Hazır senaryolar, saha haritası,
  sürücü ekranı, sonuç özeti, genişletilebilir gerekçe paneli.

Karar mantığı ayrı bir pakette yaşıyor ve API üzerinden çağrılıyor — frontend'e
gömülü senaryo cevapları değil.

### Neden `engine` ayrı bir paket?

Çünkü bir middleware ürününün asıl sınavı "gerçekten entegre edilebilir
mi?" sorusudur. Karar mantığı frontend'e gömülü bir demo değil, kendi
başına `curl` ile çağrılabilen, test edilebilen, framework'ten bağımsız
bir modül. Bu, tek dosyalık bir demoyla kanıtlanamayacak bir şey.

## `PowerSharingGroup` — bu projenin özgün katkısı

OCPP 2.0.1'de de OCPI 2.2'de de "hangi soketler aynı fiziksel güç
modülünü/kabini paylaşıyor" bilgisi **standart bir alan değil.** Bu proje
bu boşluğu `PowerSharingGroup` tipiyle dolduruyor — motor bu bilgiyi
kullanarak "1B'ye takarsan gücün 1A ile bölünecek" hesabını yapabiliyor.
Bu aynı zamanda gerçek dünyada en büyük entegrasyon sürtünmesi: her
sahanın topolojisi elle tanımlanmalı. Gerçek bir dağıtım, bu eşlemeyi ve
güncel saha durumunu bir operatör adaptörü üzerinden sağlamalıdır.

## Kural motoru

`decide()` sırasıyla şu kuralları değerlendirir:

| Kural | Ne yapar |
|---|---|
| **R1** | Power-sharing çakışması — paylaşımlı kabinde komşu soket doluyken daha iyi bir alternatif varsa öner (**ana senaryo**) |
| **R2** | Kapasite aşırı-tahsisi — yalnızca *gerçekten daha düşük nominal güçlü* bir soket, en az aynı tahmini efektif gücü veriyorsa öner (oran-bazlı eşik, sabit bir kW rakamına değil) |
| **R3** | Konnektör uyumsuzluğu — sert engel, `BLOCK` döner |
| **R4** | Seçim zaten optimal veya alternatif yok — motor sessiz kalır |
| **R5** | Suppression — aynı uyarı aynı oturumda daha önce reddedildiyse tekrar gösterilmez |

R4 kasıtlı olarak önemli: motor **yanlış-pozitif üretmemeli.** Doğru
seçim yapan bir sürücü hiçbir uyarı görmez — bir kere gereksiz uyarı
alan sürücü bir daha hiçbir öneriye güvenmez.

R2'nin "gerçekten daha düşük nominal güçlü" şartı sonradan eklendi: başta
sadece efektif gücün eşit/daha iyi olması yeterliydi, bu da aynı güçteki
iki soket arasında bile anlamsız bir "taşı" önerisi üretebiliyordu — artık
alternatif hem nominal olarak düşük hem en az aynı hızı vermek zorunda.

## Güvenlik ilkeleri

- **Read-only.** Middleware operatörün CSMS'ine hiçbir zaman yazmaz —
  şarj başlatmaz, durdurmaz, güç limiti değiştirmez. Sadece okur ve
  öneri döner. Ele geçirilse bile şarj altyapısını bozamaz.
- **Veri minimizasyonu.** Motor kullanıcı kimliğine ihtiyaç duymaz,
  sadece "bu araç kaç kW çeker" bilgisine. Plaka/VIN/isim asla toplanmaz;
  oturumlar pseudonim kimlikle temsil edilir.
- **Fail-safe.** Middleware çökerse veya yanıt vermezse sahada hiçbir
  şey değişmez — sürücü uyarı almaz, şarj normal başlar.

*(Prototip kapsamı: penetrasyon testi yapılmadı, mTLS simüle edilmiştir,
KVKK hukuki değerlendirmesi operatörün sorumluluğundadır. "Her açıdan
güvenli" iddia edilmiyor — kararlar ve sınırlar açıkça belirtiliyor. Demo
ortamında HMAC imzalama tarayıcıda çalışıyor — bu yüzden demo secret'ı
production secret'ı ya da bir güvenlik sınırı değil. Gerçek dağıtımda
imzalama operatörün kendi backend'inde yapılmalı.)*

### CSMS verisi — yasal durum

**CSMS** (Charge Station Management System), operatörün şarj ağını yöneten
backend sistemidir. OtoŞarj bu sisteme **sadece okuma erişimi** ister:
hangi soket dolu, canlı güç çekimi kaç kW. Bunun ötesinde hiçbir müdahalesi yoktur.

Bu verinin kamuya açık olup olmadığı sorusu için kısa yanıt:

- **Şu an Türkiye'de:** Hayır — anlık doluluk verisi operatörün özel verisidir.
  EPDK, konum ve soket sayısı bildirimini zorunlu kılar; anlık doluluk bildirimi
  zorunlu değildir. OtoŞarj, **B2B anlaşmayla** operatörden API erişimi alır.
- **Gelecek (AB baskısı):** AFIR (Alternative Fuels Infrastructure Regulation, 2023),
  2025'ten itibaren AB'deki tüm şarj noktalarını anlık doluluk verisini herkese açık
  API üzerinden yayınlamakla yükümlü kılıyor. Türkiye AB üyesi değil, ancak
  mevzuat uyumu stratejik öncelik listesinde.

Satış argümanı açısından bu durum avantajlıdır: operatör bu veriyi zaten EPDK
bildirimleri için topluyor; OtoŞarj sadece bu veriyi okuma erişimi karşılığında
karar motoru sunuyor. Entegrasyon riski sıfıra yakın — operatörün altyapısına
hiçbir şey yazılmıyor.

---

## Kurulum ve çalıştırma

Node.js ve npm gerekli. Repo kökünden:

```bash
npm install
npm run build --workspace=packages/engine
```

Ayrı terminallerde çalıştırın:

```bash
npm run dev:server
npm run dev:web
```

http://localhost:5173 adresini açın. Yerel API varsayılan olarak
http://localhost:3001'de.

Doğrulama:

```bash
npm test
npm run build
```

## Proje durumu

- ✅ **`packages/engine`** — tamamlandı, **30/30 test yeşil**
- ✅ **`packages/server`** — API katmanı tamam, **15/15 test yeşil**, canlı yayında
- ✅ **`packages/web`** — interaktif simülatör tamam, canlı yayında; production
  build'i ayrıca bir TypeScript tip kontrolünden geçiyor
- 📋 **`docs/business/`** — ROI modeli, SWOT, pitch deck
- 📋 **`docs/technical/`** — mimari, OCPP/OCPI entegrasyon, mevzuat analizi

Güncel durum ve sıradaki adımlar için `.ai/STATE.md` ve `.ai/NEXT.md`.

---

## Prototipin sınırları

Dürüstçe belirtilmesi gereken, henüz çözülmemiş noktalar:

- **Tarihsel/simüle örnekler gerçek performansı kanıtlamaz.** Gerçek şarj
  batarya durumuna, sıcaklığa ve donanım tahsisine göre değişir.
- **Kapsam bir saha, bir operatör, ortak bir tarife varsayımıyla sınırlı.**
  Çapraz-operatör yönlendirme ve fiyat optimizasyonu gelecek iş (Faz 2).
- **Adapter arayüzü şarj başlatamaz/durduramaz, güç değiştiremez.** Gerçek
  entegrasyon ayrıca kimlik doğrulama, güncel veri, hata yönetimi ve
  operatör tarafında bir fallback gerektirir.
- **Demo'da HMAC imzalama tarayıcıda çalışıyor.** Bu yüzden demo secret'ı
  production secret'ı ya da bir güvenlik sınırı değil — gerçek imzalama
  operatörün backend'ine ait olmalı. Penetrasyon ve yük testi yapılmadı.
- **Operatör etkisi hesabı basitleştirilmiş bir model** (güç farkı × süre ×
  tarife). Ek talebi, gerçekleşen satışı veya kârı ölçmüyor — bu yüzden
  arayüzde bilinçli olarak bir ciro vaadi gibi sunulmuyor.
- **R1'de şu an minimum bir zaman-kazancı eşiği yok** — sürücünün yer
  değiştirme zahmeti hesaba katılmıyor; saha pilotu öncesi ele alınmalı.

## Sıradaki doğrulama adımı

Read-only bir operatör veri kaynağına bağlanmak, kabin topolojisini ve
araç profillerini doğrulamak, sonra küçük bir pilot sahada öneri kabul
oranını ve gerçek zaman kazancını ölçmek. Asıl anlamlı kanıt o pilottan
gelecek.

---

## Kapsam

Bu proje **iki fazlı** tasarlandı:

- **Faz 1 (bu repo):** İstasyon-içi öneriler, tek operatör, tek tarife.
  Tüm gerekli veri operatörün kendi sahasında — dış entegrasyon gerekmez.
- **Faz 2 (yol haritası, henüz kodlanmadı):** İstasyonlar-arası ve
  çapraz-operatör öneriler. Fiyat/hız trade-off hesabı gerektirir,
  bilinçli olarak ertelendi.
