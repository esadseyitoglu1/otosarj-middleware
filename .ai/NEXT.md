# Sıradaki İşler (öncelik sırasıyla)

1. **Aşama 2 — docs/business/**: ROI modeli (3 senaryo, peak/off-peak
   ayrımlı, 4 kalem), SWOT, pitch deck.
   Problemin kamuoyundaki karşılığı olarak kullanılabilecek kayıt:
   [YouTube Shorts — "Elektrikli araç kullanma kültürü hala oturamadı"](https://youtube.com/shorts/aqu1IQ80lGM)
   (Taha Hüseyin Karagöz) — Bolu'da yaşanan, R1+R2'nin birlikte görüldüğü
   bir senaryo. README'ye eklendi.

2. **Aşama 3 — docs/technical/**: ARCHITECTURE, OCPP_OCPI_INTEGRATION,
   DATA_OWNERSHIP, INTEGRATION, REGULATORY, SECURITY, PRIVACY, PROBLEM.

3. **Saha pilotu öncesi ele alınacaklar:**
   - R1 için minimum zaman-kazancı eşiği (şu an herhangi bir efektif güç
     artışı öneri üretebiliyor; aracın yer değiştirme zahmeti hesaba
     katılmıyor)
   - Eşzamanlı ziyaretçiler için mock saha state'inin izole edilmesi

4. **(Opsiyonel) Deploy iyileştirmeleri:**
   - Basit bir `deploy.sh` scripti (şu an elle yapılıyor, adımlar
     `.ai/STATE.md`'de)
   - Geliştirme bağımlılıklarındaki (`vitest`/`vite`) major sürüm
     yükseltmesi — ayrı bir branch'te denenmeli, bkz. `KNOWN_ISSUES.md`

## Not
Canlı demo: **https://otopriz.esadseyitoglu.xyz**
