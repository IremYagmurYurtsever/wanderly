# Hesap ve veri API'si
Tüm özel uçlar `Authorization: Bearer <token>` ister. Kullanıcı kimliği istek gövdesinden değil sunucu oturumundan alınır. E-posta doğrulama uçları kaldırıldı.

## Hesap
- POST /auth/register: email, password, name, agreed:true. Hesap oluşturur.
- POST /auth/login: email, password. user, token ve expiresAt döner.
- GET /auth/me: user döner (id, email, name).
- POST /auth/logout: oturumu iptal eder.
- POST /auth/password/forgot: email. Demo modunda bağlantı terminale yazılır.
- POST /auth/password/reset: token, password. Eski oturumları kapatır.

## Kullanıcı verileri
- GET /api/profile; PUT /api/profile: name, bio, preferences, currency alanlarını günceller.
- GET /api/trips; POST /api/trips: destination, dates, isteğe bağlı notes, budget, currency.
- PUT /api/trips/:id: destination ve dates zorunlu; DELETE /api/trips/:id.
- GET /api/memories; POST /api/memories: text, isteğe bağlı tripId ve isFavorite.
- PUT /api/memories/:id: text; DELETE /api/memories/:id.
- GET /api/memories/favorites; PUT /api/memories/favorites: entryId, selected:boolean.
- GET /api/places/saved; PUT /api/places/saved: placeId, selected:boolean.

Liste uçları `{ items: [...] }` döner. Kişisel günlük favori kimliği `personal-<memoryId>` biçimindedir.
PUT seçim işlemleri tekrarlandığında tersine dönmez: seçili/seçili değil durumunu açıkça gönder.
Anı yalnızca aynı kullanıcının gezisine bağlanabilir. Gezi silinirse anı korunur, tripId boşaltılır.
Ad 2–100, biyografi 0–1000, anı 1–5000, varış noktası 1–200, tarih metni 1–100 karakterdir.
Para birimleri TRY/EUR/USD/GBP/JPY. Tarihler şimdilik serbest metindir.

## Güvenlik
Şifreler scrypt ile, tokenlar SHA-256 özeti olarak saklanır. Oturumlar 7 gün geçerlidir.
Kayıt/giriş/sıfırlama denemeleri sınırlandırılır. SQL işlemleri parametrelidir.
HTTP yalnızca güvenilir yerel ağda sahte test bilgileriyle kullanılır. İnternete açmadan önce HTTPS, gerçek e-posta kurtarma, yedekleme ve üretim güvenlik incelemesi gerekir.
API testleri: `npm test`; gerçek yerel PostgreSQL testi: `npm run test:db`.
