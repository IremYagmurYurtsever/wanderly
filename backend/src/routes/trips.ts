import type { AuthService } from '../auth/service.js';
import type { DomainService } from '../domain/service.js';
import { authenticatedRouter } from './authenticated.js';

export function createTripsRouter(auth: AuthService, domain: DomainService) {
  const router = authenticatedRouter(auth);
  router.get('/', async (_request, response) => {
    response.json({ items: await domain.getTrips(response.locals.userId) });
  });
  router.post('/', async (request, response) => {
    response.status(201).json(await domain.createTrip(response.locals.userId, request.body));
  });
  router.put('/:id', async (request, response) => {
    response.json(await domain.updateTrip(response.locals.userId, request.params.id, request.body));
  });
  router.delete('/:id', async (request, response) => {
    response.json(await domain.deleteTrip(response.locals.userId, request.params.id));
  });
  return router;
}
