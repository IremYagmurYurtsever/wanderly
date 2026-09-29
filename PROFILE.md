# Türkçe gezgin profili

Profil sekmesi tüm alt menülerden açılır. Kod `src/screens/ProfileScreen` içinde ekran, düzenleyici, stil ve kayıt hook'u olarak ayrılmıştır.

- Ad, biyografi, isteğe bağlı telefon, profil fotoğrafı, seyahat tercihleri ve bütçe para birimi /api/profile üzerinden PostgreSQL'e kaydedilir.
- Profil bilgileri ayrı bir ekranda düzenlenir. E-posta değişimi mevcut şifreyi gerektirir; demo sürümünde doğrulama e-postası gönderilmez.
- Kaydedilen ad diğer ekranlara yansır ve uygulama açılırken geri yüklenir.
- Profil ayarlarında arama, profil paylaşımı ve hesap verilerini ve eski yerel yedekleri JSON metni olarak cihaz paylaşım penceresine aktarma.
- Çıkış düğmesi backend oturumunu iptal edip giriş ekranına döner; hesap kayıtlarını silmez.

Gezi özeti hesaptaki gerçek gezi, anı ve kayıt sayılarını gösterir. Vize defterine ülke, geçerlilik başlangıcı ve verilen gün sayısı eklenir; kalan gün hesabı kişisel hatırlatıcıdır, resmi vize belgesinin yerine geçmez. Çevrimdışı eşitleme ve indirilebilir haritalar bulunmaz. Bütçe para birimi profil tercihidir, ana sayfadaki döviz hesaplayıcısını değiştirmez. Paylaşım desteği platforma bağlıdır. Profil fotoğrafı seçilmezse ad ve soyad baş harfleri görünür.
