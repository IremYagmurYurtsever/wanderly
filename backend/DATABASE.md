# PostgreSQL ve SQL değişiklikleri
Yerel veritabanı: wanderly. Uygulama rolü: wanderly_app.
Diğer veritabanları kullanılmaz; backend/.env gizlidir ve Git'e eklenmez.

## İlk kurulum
PostgreSQL servisini başlat. pgAdmin ile wanderly veritabanını oluştur.
backend/.env.example dosyasını backend/.env olarak kopyala ve DATABASE_URL içindeki gerçek uygulama rolü/parolasını yalnızca kendi bilgisayarında ayarla.
Paroladaki özel karakterleri bağlantı URL'sinde yüzde kodla. Şifreni sohbete yazma.

Backend klasöründe:
```
npm install
npm run db:generate
npm run db:migrate
npm run db:check
npm run dev
```

## Tablolar
- users: ad, e-posta, parola özeti, biyografi, telefon, profil fotoğrafı, tercihler ve para birimi.
- sessions: oturum token özeti ve son kullanım tarihi.
- action_tokens: yalnızca RESET_PASSWORD için tek kullanımlık özetler.
- trips: kullanıcıya ait seyahat planları.
- memories: kullanıcıya ait anılar; isteğe bağlı gezi, mekân, tarih, JPEG fotoğrafı ve favori durumu.
- visas: kullanıcıya ait ülke, geçerlilik başlangıcı ve verilen gün sayısı; resmi vize verisi değildir.
- saved_places: kullanıcı ve mekan kimliği için benzersiz kayıt.

## Migration geçmişi
İlk üç migration hesap/oturum/action tablolarını kurar; geçmiş dosyaları değiştirme.
20260923000100_domain_and_remove_verification, mevcut domain tablolarını silmeden eksik kurulumları tamamlar.
Aynı migration e-posta doğrulama tokenlarını, email_verified_at alanını ve VERIFY_EMAIL enum değerini kaldırır.
Şifre sıfırlama tokenları, hesaplar, geziler ve anılar korunur.
Şema değişiklikleri için migration kullan; db push veya migrate reset mevcut verileri koruyan güncelleme yöntemi değildir.

## Kontrol
db:check tüm kullanılan tablo ve yeni alanlara erişimi kontrol eder. /health yalnızca HTTP kontrolüdür.
npm run test:db yalnızca localhost/127.0.0.1 üzerindeki wanderly veritabanına izin verir; benzersiz geçici test hesaplarını test sonunda temizler.
Bu test mevcut kullanıcıları değiştirmez.
