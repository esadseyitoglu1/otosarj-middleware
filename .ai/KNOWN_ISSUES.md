# Bilinen Sınırlar

## Güvenlik incelemesi sonrası açık kalanlar (22 Eylül 2026)
- **npm audit: 1 critical + 1 high** (`vitest` <3.2.6 — GHSA-5xrq-8626-4rwp,
  arbitrary file read/execute via Vitest UI server; `vite` <=6.4.2 — path
  traversal). İkisi de devDependency, prod server bağımlılıkları
  (express/cors/helmet) etkilenmiyor, proje `vitest --ui` de kullanmıyor.
  Düzeltme vitest 2.x→3.x major bump gerektiriyor — 3 workspace'i
  etkileyebileceği için otomatik düzeltilmedi. Yapılacak: ayrı bir
  branch'te `vitest`/`vite` major upgrade denenip tüm testler+build
  doğrulanmalı.
- **`CORS_ALLOWED_ORIGINS` env değişkeni sunucuda henüz set edilmedi.**
  Kod artık bu değişken yoksa sadece localhost'a izin veriyor (önceden
  `*` idi). Deploy edilmeden önce sunucuda
  `/opt/otosarj/packages/server/.env`'e eklenmeli, yoksa production'da
  web arayüzünden yapılan fetch çağrıları CORS'a takılabilir (aynı
  domain'den serve edildiği için pratikte etkisi az ama garanti değil —
  deploy sonrası test edilmeli).
- **`simulate/reset` hâlâ operatör ayrımı yapmıyor** (kasıtlı tasarım,
  demo amaçlı tüm state'i sıfırlıyor, `client.ts`'te belgeli).

## Presentation review (22 Eylül 2026)
- **Görsel QA tamamlandı (22 Eylül):** Playwright ile 7 ekran
  görüntüsü alındı — hero, welcome guide (native dialog), senaryo A/B/C,
  teknik detaylar, mobil 390px. Hiç console/page error yok. Önceki
  "visual QA pending" notu geçersiz.
- **R1 için minimum zaman kazancı yok:** herhangi bir efektif güç artışı
  öneri üretebiliyor; aracın yer değiştirme zahmeti hesaba katılmıyor.
- **Operatör etkisi tahmini ölçülmüş ciro değil:** `operatorImpact.ts`
  hâlâ güç farkı × süre × tarife kullanıyor, talep/doluluk olmadan.
  Sabit ciro rakamları ve panel arayüzden kaldırıldı, README'de açıkça
  belirtildi.
- **Paylaşılan demo state'i:** tüm ziyaretçiler şu an aynı bellek-içi
  mock sahaları kullanıyor; eşzamanlı senaryo çalıştırmaları birbirine
  karışabilir. Hazır örnekler artık suppression için temiz session ID
  alıyor, ama saha simülasyonu ziyaretçi başına izole değil.

## Çözülmüş incident (referans için tutuluyor)
**"Büyük operatör sahasında her şey 401 dönüyordu" (18 Eylül 2026).**
Kök sebep: `packages/web/.env.production` git'e commit edilmişti
(sadece hostname için). Sunucuda bu dosyaya elle `VITE_DEMO_HMAC_SECRET`
eklenmişti. Sonraki bir `git push deploy` + hook'un yaptığı
`git checkout -f`, izlenen dosyayı git'teki (secret'sız) versiyonla
ezdi → web bundle'ı yanlış secret ile derlendi → tüm HMAC imzaları
sunucudaki secret ile eşleşmedi → her `/api/*` isteği 401.

Düzeltme: dosya `git rm --cached` ile takipten çıkarıldı,
`.gitignore`'a eklendi. **Ayrıca** `post-receive` hook'u güncellendi —
artık checkout öncesi bu dosyayı `/tmp`'e yedekleyip sonra geri
koyuyor, çünkü `git checkout -f` önceden track edilmiş bir dosyayı
ignore'a eklense bile silmeye devam eder (ignore sadece yeni dosyaları
etkiler, geçmişi değil). Detay: commit `9bb5d9f` ve hook dosyası
`/opt/otosarj-repo.git/hooks/post-receive` üzerindeki yorum.

**Ders / genel kural:** Production-only config/secret dosyaları asla
git'e girmemeli, sadece `.example` şablonları tutulmalı. Bir dosya
yanlışlıkla commit edilip sonra `git rm --cached` ile çıkarılırsa,
deploy hook'larının o dosyayı checkout'ta silmeyeceğinden ayrıca emin
olunmalı.


- **Araç DB statik fixture.** Gerçek ürün bakımlı bir araç veritabanı
  gerektirir (EV-Database benzeri kaynak ya da operatörün kendi girişi).
- **Taper modeli basitleştirilmiş.** Gerçek DC şarj eğrileri araç/sıcaklık
  bağımlıdır; `chargeTime.ts`'teki breakpoint'ler prototip amaçlı.
- **Power-sharing topolojisi manuel tanım gerektirir.** 250 soket için
  gerçek operasyonel iş — satış sürtünmesi, dürüstçe belirtilecek.
- **ROI varsayımları ölçülmedi.** Nudge kabul oranı ve verimsiz seçim
  oranı sahada test edilmedi (Aşama 2'de üç senaryolu model + açık
  varsayım notu ile ele alınacak).
- **OtoPriz uygulamasında araç profilinin zorunlu olup olmadığı bilinmiyor**
  → gerçek entegrasyon kapsamını etkiler.
- **OtoPriz'in roaming partnerleri bulunamadı** → Faz 2 kapsamı belirsiz.
- **Güvenlik kapsam dışı:** penetrasyon testi yok, mTLS prototipte simüle
  edilecek, KVKK hukuki değerlendirmesi yapılmadı (teknik veri
  minimizasyonu uygulanıyor, VERBİS/aydınlatma metni operatörün
  sorumluluğunda), yük/DDoS testi yok. "Her açıdan güvenli" iddia
  edilmiyor — kararlar ve sınırlar dokümante ediliyor.
