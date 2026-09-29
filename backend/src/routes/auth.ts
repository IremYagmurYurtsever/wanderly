import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { AuthService } from '../auth/service.js';
import type { ActionService } from '../auth/actions.js';

export function createAuthRouter(auth: AuthService, actions?: ActionService) {
  const router = Router();
  const attempts = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: 'Çok fazla deneme yapıldı. 15 dakika sonra tekrar dene.',
      code: 'RATE_LIMITED',
    },
  });
  router.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  router.post('/register', attempts, async (request, response) => {
    const result = await auth.register(request.body);
    response.status(201).json(result);
  });
  router.post('/login', attempts, async (request, response) => {
    response.json(await auth.login(request.body));
  });
  router.get('/me', async (request, response) => {
    response.json(await auth.me(request.get('authorization')));
  });
  router.post('/logout', async (request, response) => {
    await auth.logout(request.get('authorization'));
    response.sendStatus(204);
  });
  if (actions) {
    router.post('/password/forgot', attempts, async (request, response) => {
      response.json(await actions.requestReset(request.body));
    });
    router.post('/password/reset', attempts, async (request, response) => {
      response.json(await actions.reset(request.body?.token, request.body?.password));
    });
  }
  return router;
}
