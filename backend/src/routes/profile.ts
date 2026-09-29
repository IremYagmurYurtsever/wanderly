import type { AuthService } from '../auth/service.js';
import type { DomainService } from '../domain/service.js';
import { authenticatedRouter } from './authenticated.js';
import { rateLimit } from 'express-rate-limit';

export function createProfileRouter(auth: AuthService, domain: DomainService) {
  const router = authenticatedRouter(auth);
  router.get('/', async (_request, response) => {
    response.json(await domain.getProfile(response.locals.userId));
  });
  router.put('/', async (request, response) => {
    response.json(await domain.updateProfile(response.locals.userId, request.body));
  });
  router.put(
    '/email',
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Çok fazla deneme. Daha sonra yeniden dene.', code: 'RATE_LIMITED' },
    }),
    async (request, response) => {
      response.json(await domain.changeEmail(response.locals.userId, request.body));
    },
  );
  return router;
}
