# Sıradaki İşler (öncelik sırasıyla)

1. **Git + GitHub** (şu an yapılıyor): init, ilk commit, kök README.md,
   remote'a push. Kullanıcı "GitHub'ıma güzel bir README ile koyalım" dedi.

2. **packages/server** (Aşama 1, Adım 1.4): Express + TS API katmanı.
   - `POST /api/v1/scan` — ana endpoint, `engine.decide()`'i çağırır
   - `GET /api/v1/stations/:id/live`
   - `POST /api/v1/sessions/accept-nudge` / `decline-nudge` (`declineReason?` ile)
   - Mock CSMS adapter: **sadece read metodları** (güvenlik kararı G1, plana bak)
   - Güvenlik middleware: HMAC imza doğrulama, rate limit, input validation
     (plan "Güvenlik & Mahremiyet" bölümü — G1-G5)

3. **packages/web** (Aşama 1, Adım 1.5): Vite + React + Tailwind simülatör.
   - StationMap, DriverPhone, NudgeModal, EngineLog bileşenleri
   - Saha seçici (OtoPriz sahası ↔ büyük operatör sahası)
   - 4 senaryo butonu: A (R1 ana hikâye), B (R2 büyük operatör), C (negatif/PROCEED), D (R5 suppression)

4. **Aşama 2 — docs/business/**: ROI modeli (3 senaryo, peak/off-peak
   ayrımlı, 4 kalem), SWOT, pitch deck (Artifact ile).

5. **Aşama 3 — docs/technical/**: ARCHITECTURE, OCPP_OCPI_INTEGRATION,
   DATA_OWNERSHIP, INTEGRATION_OTOPRIZ, REGULATORY, SECURITY, PRIVACY, PROBLEM.

## Not
Tüm detaylı kararlar ve araştırma bulguları plan dosyasında:
`C:\Users\Monster\.claude\plans\bir-b2b-saas-ve-hidden-balloon.md`
Bu dosya plan onaylandıktan sonra da güncel kalıyor, referans olarak kullanılabilir.
