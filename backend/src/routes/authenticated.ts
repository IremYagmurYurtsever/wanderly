import { Router } from 'express';
import type { AuthService } from '../auth/service.js';

export function authenticatedRouter(auth: AuthService) {
  const router = Router();
  router.use(async (request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    const { user } = await auth.me(request.get('authorization'));
    response.locals.userId = user.id;
    next();
  });
  return router;
}
