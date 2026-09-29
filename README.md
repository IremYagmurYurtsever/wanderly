# Wanderly

Expo SDK 57, React Native, TypeScript ve kendi Express/PostgreSQL backend'imiz ile hazırlanan seyahat sunumu.

## Çalıştırma

İki ayrı terminal kullan:

1. `cd C:\Users\Yagmur\Desktop\wanderly\backend` → `npm run dev`
2. `cd C:\Users\Yagmur\Desktop\wanderly` → `npx expo start --clear`

iPhone ve bilgisayar aynı özel Wi-Fi ağında olmalı. Expo Go ile QR kodunu aç.
Geliştirmede API adresi Expo bilgisayarının adresinden, port 3000 ile bulunur.
Gerekirse kök `.env` dosyasına `EXPO_PUBLIC_API_URL=http://BILGISAYAR_IP:3000` yazıp Expo'yu yeniden başlat.
Bu değişkene veritabanı şifresi veya başka gizli anahtar koyma.
Web için backend `WEB_ORIGINS` ayarına kullandığın tam web adresini ekle.

## Dosya düzeni

- `src/screens/`: ekran, ekran hook'u, alt bileşenler, stil ve örnek içerik.
- `src/components/`: paylaşılan başlık, alt menü, modal, form bileşenleri.
- `src/auth/`: oturum kontrolü, güvenli cihaz token deposu, uygulama oturumu.
- `src/repositories/`: profil, gezi, günlük ve seçimlerin API veri erişimi.
- `src/query/`: TanStack Query önbelleği; gezi, ülke, mekan ve günlük verilerinin ekranlar arasında paylaşımı.
- `src/services/api/`: HTTP istekleri, adres ve zaman aşımı.
- `src/storage/`: kullanıcıya özel cihaz taslakları ve eski yerel kayıtlar.
- `src/models/`: veri tipleri ve API/yerel veri okuma kontrolleri.
- `backend/src/auth/`: parola, oturum ve demo şifre sıfırlama.
- `backend/src/domain/`: profil/gezi/günlük iş kuralları ve girdi kontrolleri.
- `backend/src/routes/`: kimlik kontrolü ve HTTP uçları.
- `backend/prisma/`: SQL şeması ve sıralı migration'lar.

## Gerçek ve örnek özellikler

- Kayıt, giriş, çıkış, profil, gezi oluşturma, anı kaydetme, favoriler ve mekan kaydetme API'ye bağlıdır.
- E-posta doğrulaması ve Google girişi yoktur. Şifre sıfırlama demo bağlantısı backend terminaline yazılır; e-posta gönderilmez.
- Yeni hesaplar doğrudan giriş yapabilir. E-posta adresinin sahipliği kontrol edilmez; gerçek kullanıcılarla yayına uygun değildir.
- Telefon tokenı SecureStore'dadır. Web tokenı yalnızca bellektedir; sayfa yenilenince yeniden giriş gerekir.
- Form taslakları cihazda; kalıcı hesap kayıtları PostgreSQL'dedir. Sunucu kapalıyken çevrimdışı kayıt/eşitleme yoktur.
- TanStack Query yalnızca açık oturum boyunca bellekte önbellek tutar; hesap değişince temizlenir. Gezi kaydı değişince Ana Sayfa ve Gezilerim verileri yenilenir.
- Önceki yerel kayıtlar silinmez ve otomatik olarak sunucuya yüklenmez. Profil → Günlüğü dışa aktar, mevcut kullanıcı kapsamındaki eski kayıtları `legacyLocal` alanıyla yedekler. Başka/eski kullanıcı kapsamları otomatik birleştirilmez.
- Hazır şehir, mekan, gezi ve günlük kartları ile pasaport damgaları ve rezervasyon bilgileri örnektir. Profildeki hesap sayıları gerçek kayıtlardan gelir. Ana sayfadaki kur çevirici, backend üzerinden Avrupa Merkez Bankası'nın tarihli EUR referans kurlarını kullanır; işlem kuru değildir.
- Ana sayfa ve Gezilerim ekranında gezileri, Günlüğüm ekranında kişisel anıları oluşturma, görme, düzenleme ve silme backend'e bağlıdır.
- Yolculuk planlayıcıda ülke ile takvimden gidiş/dönüş seçilir. Planla, otel ve gezilecek yer önerileri, bütçe, para birimi ve ulaşım notları olan rota ekranını açar. Duraklar Google Haritalar'da açılabilir; kaydedilen planlar PostgreSQL'de tutulur ve gidiş tarihine göre geri sayımla Gezilerim'de görünür. Otel veya mekan seçimi rezervasyon yapmaz.
- Rota ekranı seçilen ülkede en fazla beş konaklama ve beş gezilecek yer önerisini fotoğraflı kartlarda gösterir. Eşleşen açık lisanslı fotoğraf yoksa kart temsili görsel diye işaretlenir. Kart ayrıntı ekranını açar; Ekle düğmesi durağı plana alır, kalıcı kayıt için ayrıca Planı kaydet gerekir.
- Keşfet → Konaklama kategorisi seçilen ülkedeki gerçek otelleri Google Places API üzerinden getirir. Otel kartları da diğer mekânlar gibi adres, harita, ayrıntı, kaydetme ve varsa Wikimedia fotoğrafı gösterir. Google Demo Key otel fiyatı, müsaitlik veya rezervasyon sağlamaz.
- Ana sayfanın üst arama alanı Google Places üzerinden ülke sınırı olmadan mekân/restoran arar. Son aramalar ve son sonuçlar kullanıcıya özel cihaz depolamasında tutulur; eşleşen açık lisanslı fotoğraf yoksa kartta temsili görsel açıkça belirtilir.
- Harita indirme, ödeme, gerçek rezervasyon ve üretim e-posta gönderimi yoktur.

## Kontroller

`npm run check`: TypeScript, ESLint, mobil birim testleri ve biçim kontrolü.
Backend: `npm run build`, `npm test`, `npm run test:db`.
Veritabanı kurulumu: [backend/DATABASE.md](backend/DATABASE.md).
API: [backend/AUTH.md](backend/AUTH.md). Demo: [backend/DEMO.md](backend/DEMO.md).
