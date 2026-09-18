# OtoŞarj — Akıllı Soket Yönlendirme Middleware

Sürücüye yeni bir uygulama yükletmeden, DC hızlı şarj istasyonlarındaki
**verimsiz soket seçimlerini** anında tespit edip "Nudge" (yönlendirme)
öneren bir karar motoru ve middleware API prototipi.

**🔗 Canlı demo:** https://otopriz.esadseyitoglu.xyz

> **Bağlam:** Bu proje, Türkiye'deki şarj ağı operatörü **OtoPriz**'e
> (Eksim Holding) staj başvurusu için hazırlanan çalışan bir prototiptir.
> Amaç, sahada gerçekten yaşanan iki verimsizliği somut kodla göstermek.

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
verimsizse, ekranda kullanıcı dostu bir öneri belirir:

> *"Dikkat: Bu sokete takarsanız hızınız 90 kW'a bölünecek. 3 metre
> yanınızdaki boş 2A kabinine geçerek 180 kW tam güçle 2 kat hızlı şarj
> olabilirsiniz. Tercih sizin."*

Zorlama yok — sürücü isterse öneriyi kabul eder, isterse mevcut seçimiyle
devam eder. **Sıfır ekstra uygulama, sıfır donanım değişikliği.**

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
- **`packages/server`** — Express tabanlı API katmanı. Operatörün mevcut
  QR akışına takılacak `POST /api/v1/scan` uç noktasını sunar.
- **`packages/web`** — İnteraktif simülatör. Sahayı, sürücü telefonunu ve
  motorun karar sürecini canlı gösterir (demo amaçlı).

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
sahanın topolojisi elle tanımlanmalı.

## Kural motoru

`decide()` sırasıyla şu kuralları değerlendirir:

| Kural | Ne yapar |
|---|---|
| **R1** | Power-sharing çakışması — paylaşımlı kabinde komşu soket doluyken daha iyi bir alternatif varsa öner (**ana senaryo**) |
| **R2** | Kapasite aşırı-tahsisi — soket/araç güç oranı eşiği aşınca (oran-bazlı, sabit bir kW rakamına değil) öner |
| **R3** | Konnektör uyumsuzluğu — sert engel, `BLOCK` döner |
| **R4** | Seçim zaten optimal veya alternatif yok — motor sessiz kalır |
| **R5** | Suppression — aynı uyarı aynı oturumda daha önce reddedildiyse tekrar gösterilmez |

R4 kasıtlı olarak önemli: motor **yanlış-pozitif üretmemeli.** Doğru
seçim yapan bir sürücü hiçbir uyarı görmez — bir kere gereksiz uyarı
alan sürücü bir daha hiçbir öneriye güvenmez.

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
güvenli" iddia edilmiyor — kararlar ve sınırlar açıkça belirtiliyor.)*

---

## Kurulum ve çalıştırma

```bash
npm install

# Motor testlerini çalıştır
npm run test --workspace=packages/engine

# Motoru derle (tip kontrolü dahil)
npm run build --workspace=packages/engine

# Server + web birlikte (Aşama 1 tamamlandığında)
npm run dev
```

## Proje durumu

- ✅ **`packages/engine`** — tamamlandı, 25/25 test yeşil
- ✅ **`packages/server`** — API katmanı tamam, 15/15 test yeşil, canlı yayında
- ✅ **`packages/web`** — interaktif simülatör tamam, canlı yayında
- 📋 **`docs/business/`** — ROI modeli, SWOT, pitch deck
- 📋 **`docs/technical/`** — mimari, OCPP/OCPI entegrasyon, mevzuat analizi

Güncel durum ve sıradaki adımlar için `.ai/STATE.md` ve `.ai/NEXT.md`.

---

## Kapsam

Bu proje **iki fazlı** tasarlandı:

- **Faz 1 (bu repo):** İstasyon-içi öneriler, tek operatör, tek tarife.
  Tüm gerekli veri operatörün kendi sahasında — dış entegrasyon gerekmez.
- **Faz 2 (yol haritası, henüz kodlanmadı):** İstasyonlar-arası ve
  çapraz-operatör öneriler. Fiyat/hız trade-off hesabı gerektirir,
  bilinçli olarak ertelendi.
