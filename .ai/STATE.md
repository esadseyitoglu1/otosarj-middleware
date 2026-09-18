# Mevcut Durum

## Çalışan
- **packages/engine tamamlandı.** 25/25 test yeşil. R1-R5 kuralları,
  iki saha fixture'ı, taper modelli süre tahmini.
- **packages/server tamamlandı.** 15/15 test yeşil. HMAC imzalı API
  (`POST /api/v1/scan` vb.), rate limit, input validation, read-only
  CSMS adapter, pseudonim + agrege telemetri.
- **packages/web tamamlandı.** Vite + React + Tailwind simülatör.
  StationMap, DriverPhone, NudgeModal, EngineLog, ScenarioBar (3 hazır
  senaryo). Tarayıcıda Web Crypto ile HMAC imzalıyor (prototip kısayolu,
  bkz. `api/client.ts` yorum).
- **CANLI YAYINDA:** https://otopriz.esadseyitoglu.xyz
  - Kullanıcının kendi sunucusunda (Debian 12, 78.135.85.106) host ediliyor
  - Systemd servisi: `otosarj.service` (`enabled`, port 3001, sadece localhost)
  - Statik web dosyaları: `/srv/otosarj/` (host) → Caddy `file_server` ile servis
  - Reverse proxy: mevcut Docker Caddy container'ı (`/opt/services/`),
    `otopriz.esadseyitoglu.xyz` bloğu eklendi — `/api/*` ve `/health`
    port 3001'e proxy, geri kalan statik dosyalardan
  - HTTPS: Let's Encrypt otomatik sertifika (Caddy), doğrulandı
  - Uçtan uca production testi geçti: senaryo A (1A dolu→1B okut→R1→2A önerisi)
    ve senaryo B (büyük operatör sahası, PHEV+300kW→R2→fast-1 önerisi)
  - Güvenlik testleri production'da doğrulandı: imzasız istek 401,
    yetkisiz saha erişimi 401

## Deploy mimarisi (önemli — başka bir ajan devam edecekse)
- Kod akışı: local → `git push origin main` (GitHub, private) VE
  `git push deploy main` (sunucudaki bare repo `/opt/otosarj-repo.git`)
- Sunucuda `post-receive` hook otomatik `git checkout` yapıyor →
  `/opt/otosarj`. **Ama build/restart OTOMATIK DEĞİL** — her deploy'da elle:
  ```
  ssh root@78.135.85.106  (veya esadseyitoglu.xyz, DNS bazen bu makineden
                            yavaş çözülüyor, IP daha güvenilir)
  cd /opt/otosarj
  npm install
  npm run build --workspace=packages/engine
  npm run build --workspace=packages/server
  npm run build --workspace=packages/web
  cp -r packages/web/dist/* /srv/otosarj/
  systemctl restart otosarj.service
  ```
- SSH erişimi: `~/.ssh/otosarj_deploy` (ed25519, şifresiz, sadece bu proje
  için üretildi, `authorized_keys`'e eklendi). Root şifresi artık
  kullanılmıyor/gerekmiyor.
- Secret'lar SADECE sunucuda: `/opt/otosarj/packages/server/.env`
  (`OTOSARJ_DEMO_HMAC_SECRET`) ve `/opt/otosarj/packages/web/.env.production`
  (aynı secret, `VITE_DEMO_HMAC_SECRET` — web build-time'da bundle'a gömüyor).
  Bu iki değer BİRBİRİYLE EŞLEŞMELİ. Local repo'da secret YOK.
- Caddyfile ve docker-compose.yml `/opt/services/`'te — **paylaşımlı**,
  n8n ve başka projeler de orada. Sadece `otopriz.esadseyitoglu.xyz`
  bloğu ve `/srv/otosarj` mount satırı eklendi, başka hiçbir şeye
  dokunulmadı. Yedekler: `Caddyfile.bak-otosarj-*`, `docker-compose.yml.bak-otosarj-*`.

## Henüz yapılmadı
- `docs/business/`: ROI modeli, SWOT, pitch deck
- `docs/technical/`: mimari, OCPP/OCPI entegrasyon dokümanı, mevzuat analizi,
  SECURITY.md, PRIVACY.md
- Otomatik deploy (CI/CD) yok — her değişiklik elle build+restart gerektiriyor
