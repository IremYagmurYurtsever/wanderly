import type { AuthService } from '../auth/service.js';
import type { DomainService } from '../domain/service.js';
import { authenticatedRouter } from './authenticated.js';

export function createVisasRouter(auth: AuthService, domain: DomainService) {
  const router = authenticatedRouter(auth);
  router.get('/', async (_request, response) => {
    response.json({ items: await domain.getVisas(response.locals.userId) });
  });
  router.post('/', async (request, response) => {
    response.status(201).json(await domain.createVisa(response.locals.userId, request.body));
  });
  router.put('/:id', async (request, response) => {
    response.json(
      await domain.updateVisa(response.locals.userId, String(request.params.id), request.body),
    );
  });
  router.delete('/:id', async (request, response) => {
    response.json(await domain.deleteVisa(response.locals.userId, String(request.params.id)));
  });
  return router;
}
