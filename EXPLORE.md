# Türkçe Keşfet ekranı

Ana Sayfa veya Gezilerim ekranındaki Keşfet sekmesinden açılır. `src/screens/ExploreScreen` klasöründe ekran, kart bileşeni, stiller, örnek veriler ve API ile kayıt tutan hook bulunur.

- Kategori filtreleri, Türkçe arama ve boş sonuç durumu.
- Mekân ve Roma koleksiyonu kaydetme; /api/places/saved üzerinden kullanıcıya özel PostgreSQL kaydı.
- Kart ayrıntıları ve koleksiyon kısayolları.
- Mevcut alt menü ve güvenli ekran alanlarıyla uyumlu düzen.

Kartlar arayüzü göstermek için örnek içeriktir. Puanlar canlı değildir; restoran fotoğrafları temsili stok görsellerdir. Kaydetme rezervasyon oluşturmaz.

## Görsel kaynakları

- Roma: projede bulunan `assets/trips/rome.jpg`.
- Makarna: https://images.unsplash.com/photo-1473093295043-cdd812d0e601
- Dondurma: https://images.unsplash.com/photo-1563805042-7684c019e1cb
- Restoran: https://images.unsplash.com/photo-1555396273-367ea4eb4db5
- Galeri: Lamelolguy, Wikimedia Commons, CC0: https://commons.wikimedia.org/wiki/File:Interior_of_Galleria_Doria_Pamphilj,_Rome_03.jpg
