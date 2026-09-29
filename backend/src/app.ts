import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health.js';
import { createAuthRouter } from './routes/auth.js';
import type { AuthService } from './auth/service.js';
import { AuthError } from './auth/validation.js';
import type { ActionService } from './auth/actions.js';
import { createAccountRouter } from './routes/account.js';
import type { DomainService } from './domain/service.js';
import { createProfileRouter } from './routes/profile.js';
import { createVisasRouter } from './routes/visas.js';
import { createTripsRouter } from './routes/trips.js';
import { createMemoriesRouter } from './routes/memories.js';
import { createPlacesRouter } from './routes/places.js';
import type { GooglePlacesService } from './places/google.js';
import type { PlacePhotoService } from './places/photos.js';
import type { PlaceSummaryService } from './places/summaries.js';
import { createExchangeRouter } from './routes/exchange.js';
import type { ExchangeRateService } from './exchange/rates.js';

export function createApp(
  webOrigins: string[] = [],
  auth?: AuthService,
  actions?: ActionService,
  domain?: DomainService,
  googlePlaces?: GooglePlacesService,
  photos?: PlacePhotoService,
  summaries?: PlaceSummaryService,
  exchange?: ExchangeRateService,
) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: webOrigins }));
  app.use('/api/memories', express.json({ limit: '2mb' }));
  app.use('/api/profile', express.json({ limit: '2mb' }));
  app.use(express.json({ limit: '16kb' }));
  app.use('/health', healthRouter);
  if (exchange) app.use('/api/exchange', createExchangeRouter(exchange));
  if (auth) app.use('/auth', createAuthRouter(auth, actions));
  if (actions) app.use('/account', createAccountRouter(actions));
  if (auth && domain) {
    app.use('/api/profile', createProfileRouter(auth, domain));
    app.use('/api/visas', createVisasRouter(auth, domain));
    app.use('/api/trips', createTripsRouter(auth, domain));
    app.use('/api/memories', createMemoriesRouter(auth, domain));
    app.use('/api/places', createPlacesRouter(auth, domain, googlePlaces, photos, summaries));
  }

  app.use((_request, response) => {
    response.status(404).json({ error: 'Bu adres bulunamadı.' });
  });
  const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
    if (error instanceof AuthError) {
      response.status(error.status).json({ error: error.message, code: error.code });
      return;
    }
    if (error?.type === 'entity.parse.failed') {
      response.status(400).json({ error: 'Geçerli JSON verisi gönderilmeli.' });
      return;
    }
    if (error?.type === 'entity.too.large') {
      response.status(413).json({ error: 'Gönderilen veri çok büyük.' });
      return;
    }
    console.error('Beklenmeyen sunucu hatası. İstek tamamlanamadı.');
    response.status(500).json({ error: 'Sunucuda bir hata oluştu.' });
  };
  app.use(handleError);
  return app;
}
