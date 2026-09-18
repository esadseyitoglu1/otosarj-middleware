# Mevcut Durum

## Çalışan
- **packages/engine tamamlandı ve test edildi.** 25/25 test yeşil, `tsc` temiz.
  - `decide()` motoru: R1 (power-sharing, ana hikâye), R2 (kapasite
    aşırı-tahsisi, oran-bazlı), R3 (konnektör uyumsuzluğu → BLOCK),
    R4 (optimal seçim → sessiz PROCEED), R5 (suppression, tekrar uyarmama)
  - İki saha fixture'ı: `station-otopriz` (180/120 kW, gerçekçi OtoPriz
    topolojisi) ve `station-large-operator` (300 kW dahil) — aynı motorun
    iki farklı topolojide doğru çalıştığının kodla kanıtı
  - 13 araç fixture'ı, Türkiye pazarına uygun (Togg, IONIQ, Tesla, PHEV'ler dahil)
  - Taper modelli şarj süresi tahmini (sabit güç varsayımı yok) + EPDK %85
    sonlandırma bayrağı
  - Mesaj şablonları sunucu tarafında sabit, istemci girdisi karışmıyor

## Henüz yapılmadı
- `packages/server`: Express API katmanı (`POST /scan` vb.), güvenlik
  middleware'leri (HMAC, rate limit, validation), mock CSMS adapter
- `packages/web`: React simülatör arayüzü (saha görünümü, sürücü telefonu,
  karar motoru logu, saha seçici)
- `docs/business/`: ROI modeli, SWOT, pitch deck
- `docs/technical/`: mimari, OCPP/OCPI entegrasyon dokümanı, mevzuat analizi
- Git deposu henüz başlatılmadı / GitHub'a konmadı (kullanıcı istedi, sırada)
- Kök `README.md` henüz yazılmadı

## Şu an yapılıyor
Git init + ilk commit + GitHub'a push hazırlığı (README dahil). Ardından
Aşama 1'in kalanına (server + web) devam edilecek.
