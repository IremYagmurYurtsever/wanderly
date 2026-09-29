# Demo şifre sıfırlama
E-posta doğrulaması kaldırıldı. Kayıt sonrası giriş yapılabilir.
Bu özellik e-posta GÖNDERMEZ ve yalnızca yerel sunum içindir.

1. Backend .env içinde MAIL_MODE=demo ve PUBLIC_BASE_URL=http://localhost:3000 bulunmalı.
2. Uygulamada Şifremi unuttum ekranına kayıtlı test adresini yaz.
3. Backend terminalindeki /account/reset bağlantısını bilgisayarda aç.
4. Yeni şifreyi iki kez yazıp onayla; uygulamada yeni şifreyle giriş yap.

API bağlantıyı döndürmez. Bilinmeyen e-postaya da aynı genel mesajı verir.
Bağlantı 30 dakika geçerli, tek kullanımlıktır. Yeniden isteme aralığı en az 60 saniyedir.
GET isteği şifreyi değiştirmez. Başarılı sıfırlama eski oturumları iptal eder.
MAIL_MODE=disabled olduğunda sıfırlama uçları kapalıdır. Demo modu production ortamında açılmaz.

Gerçek gönderim daha sonra ActionDelivery adaptörüyle eklenebilir; yalnızca ayar değişikliği yeterli değildir.
SMTP sağlayıcısı, HTTPS bağlantıları ve hata/yeniden deneme akışı ayrıca kurulmalıdır.
