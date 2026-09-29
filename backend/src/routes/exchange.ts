import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { ExchangeRateService } from '../exchange/rates.js';

export function createExchangeRouter(exchange: ExchangeRateService) {
  const router = Router();
  router.use(rateLimit({ windowMs: 60000, limit: 30 }));
  router.get('/rates', async (_request, response) => {
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.json(await exchange.load());
  });
  return router;
}
