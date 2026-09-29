import type { AuthService } from '../auth/service.js';
import type { DomainService } from '../domain/service.js';
import { authenticatedRouter } from './authenticated.js';

export function createMemoriesRouter(auth: AuthService, domain: DomainService) {
  const router = authenticatedRouter(auth);
  router.get('/', async (_request, response) => {
    response.json({ items: await domain.getMemories(response.locals.userId) });
  });
  router.get('/favorites', async (_request, response) => {
    response.json({ items: await domain.getFavorites(response.locals.userId) });
  });
  router.put('/favorites', async (request, response) => {
    response.json(await domain.setFavorite(response.locals.userId, request.body));
  });
  router.post('/', async (request, response) => {
    response.status(201).json(await domain.createMemory(response.locals.userId, request.body));
  });
  router.put('/:id', async (request, response) => {
    response.json(
      await domain.updateMemory(response.locals.userId, request.params.id, request.body),
    );
  });
  router.delete('/:id', async (request, response) => {
    response.json(await domain.deleteMemory(response.locals.userId, request.params.id));
  });
  return router;
}
