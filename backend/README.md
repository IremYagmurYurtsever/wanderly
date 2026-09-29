# Wanderly backend
Node.js 24+, Express 5, TypeScript, Prisma 7 ve PostgreSQL.

## Başlatma
Kurulum için [DATABASE.md](DATABASE.md) dosyasını izle. Ardından backend klasöründe `npm run dev`.
Derlenmiş sürüm: `npm run build` ardından `npm start`. Aynı portta iki sunucu çalıştırma.
Sağlık kontrolü: http://localhost:3000/health.

## Telefon bağlantısı
Bilgisayar ve iPhone aynı özel Wi-Fi'da olmalı. HOST=0.0.0.0 yerel ağ bağlantısına izin verir.
Telefondan http://BILGISAYAR_IP:3000/health adresini açarak ağ erişimini kontrol et.
Expo Go geliştirici adresinden API sunucusunu otomatik bulur; gerekirse mobil kök .env içinde EXPO_PUBLIC_API_URL ayarla.
Güvenlik duvarını kapatma; Node.js'e yalnızca özel ağ erişimi ver. Modem port yönlendirmesi yapma.
Web için WEB_ORIGINS virgülle ayrılmış tam origin adresleridir. CORS bir kimlik kontrolü değildir.

## Özellikler
Mobil uygulama kendi API'mize bağlıdır; Firebase kullanılmaz.
E-posta doğrulaması yoktur. Şifre sıfırlama terminal bağlantılı demodur, e-posta gönderilmez.
Profil, gezi, anı ve favoriler kullanıcıya özel PostgreSQL kayıtlarıdır.
Gezi kayıtları ülke, gidiş/dönüş tarihleri, bütçe, notlar, en fazla 10 konaklama ve 30 gezilecek durağı saklar. Yeni şema için `npm run db:migrate` çalıştır.
`GET /api/exchange/rates`, Avrupa Merkez Bankası'nın günlük EUR referans kurlarını (TRY, USD, GBP, JPY) bir saatlik önbellekle sunar. Kur tarihi yanıtta yer alır; bu değerler işlem kuru değildir.
[API](AUTH.md), [Demo sıfırlama](DEMO.md), [Veritabanı](DATABASE.md).

## Ücretsiz Google mekânları
Sunum amaçlı [Google Maps Demo Key](https://developers.google.com/maps/demo-key) oluştur. Anahtarı yalnızca `backend/.env` içindeki `GOOGLE_MAPS_API_KEY` alanına yaz; mobil uygulamaya veya Git'e ekleme. Backend'i yeniden başlat. Keşfet ekranındaki ülke seçimi, desteklenen ülkelerdeki gerçek mekân adlarını ve adreslerini Places API (New) üzerinden getirir; ülke bilgisi yanıtın adres bileşenleriyle doğrulanır. Demo Key kullanıcı fotoğraflarını, yorumları ve puanları sağlamaz. Canlı kartlar mekân adıyla Wikimedia Commons'ta açık lisanslı görsel arar; eşleşme bulunursa fotoğrafçı/kaynak/lisans bağlantılarını gösterir, bulunamazsa açıkça işaretlenen temsili yerel görsel kullanır. Türkçe Vikipedi'de aynı başlık varsa iki cümlelik özeti ve kaynak/lisans bağlantısı gösterilir; yoksa açıklama uydurulmaz. Wikimedia aramaları sıraya konur ve 12 saat önbelleklenir; Wikimedia yanıtı 429 ise `Retry-After` süresince yeni arama yapılmaz. Otomatik ad eşleştirme her zaman doğru fotoğrafı garanti etmez; sunumdan önce önemli kartları gözle kontrol et. İtalya'daki eski editör seçkisi ayrı kalır. Demo Key günlük sınırlıdır ve yalnızca prototip için uygundur.

## Doğrulama
`npm run build`, `npm test`, `npm run test:db`, `npm run db:check`.
SMTP, çevrimdışı eşitleme ve üretim dağıtımı kapsam dışıdır.
