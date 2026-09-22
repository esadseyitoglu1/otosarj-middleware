# Sıradaki İşler (öncelik sırasıyla)

0. **Deploy et:** Görsel doğrulama tamamlandı (Playwright, 7 ekran
   görüntüsü, hiç hata yok), README/marka dili Türkçe'ye geri döndürüldü,
   testler yeşil (engine 30/30, server 15/15). Sırada: commit → GitHub
   push → sunucuya deploy (`.ai/STATE.md`'deki elle deploy adımları) →
   canlı URL'de A/B/C senaryolarını tekrar doğrula.
   - Saha pilotu öncesi: R1 için minimum zaman-kazancı eşiği değerlendir,
     eşzamanlı ziyaretçiler için mock saha state'ini izole et.

1. **Aşama 2 — docs/business/**: ROI modeli (3 senaryo, peak/off-peak
   ayrımlı, 4 kalem), SWOT, pitch deck (Artifact ile web tabanlı).
   Pitch'in açılışında kamuoyu kanıtı olarak kullanılacak:
   [YouTube Shorts — "Elektrikli araç kullanma kültürü hala oturamadı"](https://youtube.com/shorts/aqu1IQ80lGM)
   (Taha Hüseyin Karagöz) — Bolu Highway'de yaşanan tam R1+R2 senaryosu,
   README'ye zaten eklendi.

2. **Aşama 3 — docs/technical/**: ARCHITECTURE, OCPP_OCPI_INTEGRATION,
   DATA_OWNERSHIP, INTEGRATION_OTOPRIZ, REGULATORY, SECURITY, PRIVACY,
   PROBLEM.

3. **(Opsiyonel) Deploy iyileştirmeleri:**
   - Basit bir `deploy.sh` scripti yazılabilir (şu an elle yapılıyor,
     adımlar `.ai/STATE.md`'de yazılı)
   - `otopriz.esadseyitoglu.xyz` yerine daha kısa bir isim istenirse
     Caddyfile + web `.env.production` + DNS kaydı güncellenmeli

## Not
Canlı demo: **https://otopriz.esadseyitoglu.xyz**
Tüm detaylı kararlar ve araştırma bulguları plan dosyasında:
`C:\Users\Monster\.claude\plans\bir-b2b-saas-ve-hidden-balloon.md`
