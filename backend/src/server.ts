import { createApp } from './app.js';
import { readConfig } from './config.js';
import { createDatabase } from './database.js';
import { createAuthRepository } from './auth/repository.js';
import { createAuthService } from './auth/service.js';
import { createActionRepository } from './auth/action-repository.js';
import { createActionService } from './auth/actions.js';
import { createDemoDelivery, readDeliveryConfig } from './auth/delivery.js';
import { createDomainService } from './domain/service.js';
import { createGooglePlacesService } from './places/google.js';
import { createPlacePhotoService } from './places/photos.js';
import { createPlaceSummaryService } from './places/summaries.js';
import { createExchangeRateService } from './exchange/rates.js';

const config = readConfig();
const deliveryConfig = readDeliveryConfig();
const database = createDatabase();
const actions =
  deliveryConfig.mode === 'demo'
    ? createActionService(
        createActionRepository(database),
        createDemoDelivery(),
        deliveryConfig.baseUrl,
      )
    : undefined;
const domain = createDomainService(database);
const app = createApp(
  config.webOrigins,
  createAuthService(createAuthRepository(database)),
  actions,
  domain,
  createGooglePlacesService(process.env.GOOGLE_MAPS_API_KEY),
  createPlacePhotoService(),
  createPlaceSummaryService(),
  createExchangeRateService(),
);
const server = app.listen(config.port, config.host, () => {
  console.log(`Wanderly backend hazır: http://localhost:${config.port}/health`);
  if (actions)
    console.log(
      'DEMO MODU: E-postalar gönderilmez; özel bağlantılar yalnızca bu terminalde görünür.',
    );
});

server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `${config.port} portu kullanımda. Diğer sunucuyu kapat veya PORT değerini değiştir.`
      : 'Sunucu başlatılamadı: ' + error.message,
  );
  process.exitCode = 1;
});

function shutdown() {
  server.close(() => {
    database.$disconnect().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
