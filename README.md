# Wanderly

Wanderly, seyahat planlarımı ve gezilerden kalan anıları bir arada tutabilmek için geliştirdiğim bir mobil uygulama projesi. Bir ülke seçip gezi tarihlerini belirleyebiliyor, gitmek istediğim yerleri plana ekleyebiliyor ve yolculuk sırasında fotoğraflarla kendi seyahat günlüğümü oluşturabiliyorum.

## Uygulamada neler var?

- **Ana sayfa:** Yaklaşan gezilerimi görebiliyor, yeni bir yolculuk planlamaya başlayabiliyor ve mekân arayabiliyorum.
- **Gezilerim:** Gideceğim ülkeyi ve tarihleri seçip konaklama, gezilecek yer, bütçe ve notlardan oluşan bir plan hazırlayabiliyorum. Daha sonra planı açıp değiştirebiliyorum.
- **Keşfet:** Mekânları ve konaklama seçeneklerini inceleyebiliyor, ilgimi çekenleri kaydedebiliyor ve konumlarını haritada açabiliyorum.
- **Günlüğüm:** Gezilerime ait günlere yazı ve fotoğraf ekleyerek anılarımı saklayabiliyorum.
- **Profil:** Hesap bilgilerimi, gezi özetimi ve kaydettiklerimi görebiliyorum.

Uygulamanın ekranlarını React Native, TypeScript ve Expo ile hazırladım. Hesap, gezi ve günlük bilgilerinin saklanması için ayrıca Express ve PostgreSQL kullanan bir backend geliştirdim.

## Projeyi çalıştırma

Bu proje şu anda geliştirme ve sunum aşamasında. Çalıştırmak için bilgisayarda PostgreSQL, Node.js ve telefonda Expo Go gerekiyor. Önce [veritabanı kurulumunu](backend/DATABASE.md) tamamlayıp `backend/.env.example` dosyasını örnek alarak `backend/.env` dosyasını hazırlamak gerekiyor.

Ardından iki ayrı terminal açıyorum:

```powershell
cd backend
npm install
npm run dev
```

```powershell
npm install
npx expo start --clear
```

## Şu anki durum
 Projeyi geliştirmeye devam ediyorum.
