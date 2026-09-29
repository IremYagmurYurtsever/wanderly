# Türkçe seyahat günlüğü

Günlüğüm sekmesi tatil planlarına bağlı, fotoğraflı kapakları olan defterleri gösterir. Devam eden tatil varsa günlüğü otomatik açılır; örnek kayıtlar anı sayısına katılmaz.

- Yeni anı yazarken gezi, mekân adı, ziyaret tarihi ve isteğe bağlı bir JPEG fotoğrafı seçilebilir. Mekân alanında gezi planındaki duraklar ve yazarken aranan canlı mekân adları önerilir; arama çalışmasa da ad elle yazılabilir.
- Mekân detayındaki "Günlüğe ekle" düğmesi Günlüğüm sayfasını açar. Önce tatil seçilir; planın gidiş ve dönüş günleri dahil her gün için bir sayfa açılır. Tarihi olmayan eski planlarda takvimden gün seçilir.
- Gezi planındaki konaklama ve gezilecek yerler ilgili günlüğün gün sayfasında önerilir. Her gün birden çok mekân notu ve fotoğraf eklenebilir; önceki anılar değişmez.
- Profilden kaydedilen tatil günlükleri ve anı sayıları görülüp ilgili günlüğe geçilebilir. Geziyle eşleşmeyen eski notlar ayrı arşivde korunur.
- Fotoğraf Expo Go içinde galeri seçicisiyle alınır. Prototipte anı başına bir fotoğraf ve yaklaşık 1 MB sınırı vardır.
- Anılar, gezi ilişkisi ve fotoğraflar `/api/memories` üzerinden PostgreSQL'de kullanıcıya özel saklanır.
- Karttan anıyı yeniden açabilir, düzenleyebilir, silebilir, favorileyebilir ve paylaşabilirsin.
- Arama yalnızca kayıtlı anıları kullanır. İnternet ve backend bağlantısı gerekir; çevrimdışı eşitleme yoktur.
