# Bilinen Sınırlar

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
