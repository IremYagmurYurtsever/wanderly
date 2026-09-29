import { createDatabase } from '../database.js';

async function checkDatabase() {
  const database = createDatabase();
  try {
    await database.$queryRaw`SELECT 1`;
    await Promise.all([
      database.user.findFirst({ select: { id: true, journalFavorites: true, phone: true } }),
      database.session.count(),
      database.actionToken.count(),
      database.trip.count(),
      database.memory.count(),
      database.savedPlace.count(),
      database.visa.count(),
    ]);
    console.log('PostgreSQL bağlantısı ve hesap, oturum, gezi, günlük, vize, kayıt tabloları hazır.');
  } finally {
    await database.$disconnect();
  }
}

checkDatabase().catch(() => {
  console.error(
    'Veritabanı kontrolü başarısız. DATABASE_URL, PostgreSQL servisi ve db:migrate adımını kontrol et. Şifreni veya bağlantı adresini paylaşma.',
  );
  process.exitCode = 1;
});
