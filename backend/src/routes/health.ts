import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json({
    status: 'ok',
    service: 'wanderly-backend',
    message: 'Wanderly sunucusu çalışıyor.',
  });
});
