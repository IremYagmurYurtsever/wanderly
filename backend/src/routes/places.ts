import type { AuthService } from '../auth/service.js';
import type { DomainService } from '../domain/service.js';
import { authenticatedRouter } from './authenticated.js';
import type { GooglePlacesService } from '../places/google.js';
import { AuthError } from '../auth/validation.js';
import { rateLimit } from 'express-rate-limit';
import { countries, getCountry } from '../places/countries.js';
import type { PlacePhotoService } from '../places/photos.js';
import type { PlaceSummaryService } from '../places/summaries.js';

export function createPlacesRouter(
  auth: AuthService,
  domain: DomainService,
  googlePlaces?: GooglePlacesService,
  photos?: PlacePhotoService,
  summaries?: PlaceSummaryService,
) {
  const router = authenticatedRouter(auth);
  const googleLimit = rateLimit({
    windowMs: 60000,
    limit: 12,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  const mediaLimit = rateLimit({ windowMs: 60000, limit: 30 });
  router.get('/countries', (_request, response) => {
    response.json({ items: countries.map(({ code, label }) => ({ code, label })) });
  });
  router.get('/photo', mediaLimit, async (request, response) => {
    if (!photos) throw new AuthError(503, 'PHOTO_UNAVAILABLE', 'Fotoğraflar hazır değil.');
    const title = request.query.title;
    const countryCode = request.query.country;
    if (
      typeof title !== 'string' ||
      title.trim().length < 3 ||
      title.length > 120 ||
      typeof countryCode !== 'string' ||
      !getCountry(countryCode)
    )
      throw new AuthError(400, 'INVALID_INPUT', 'Mekân veya ülke geçersiz.');
    response.json({ photo: await photos.lookup(title.trim(), countryCode.toUpperCase()) });
  });
  router.get('/summary', mediaLimit, async (request, response) => {
    if (!summaries) throw new AuthError(503, 'SUMMARY_UNAVAILABLE', 'Özetler hazır değil.');
    const title = request.query.title;
    const countryCode = request.query.country;
    if (
      typeof title !== 'string' ||
      title.trim().length < 3 ||
      title.length > 120 ||
      typeof countryCode !== 'string' ||
      !getCountry(countryCode)
    )
      throw new AuthError(400, 'INVALID_INPUT', 'Mekân veya ülke geçersiz.');
    response.json({ summary: await summaries.lookup(title.trim(), countryCode.toUpperCase()) });
  });
  router.get('/discover', googleLimit, async (request, response) => {
    if (!googlePlaces)
      throw new AuthError(503, 'GOOGLE_UNAVAILABLE', 'Google mekanları hazır değil.');
    const category = request.query.category;
    const query = request.query.query ?? '';
    const country =
      typeof request.query.country === 'string' ? getCountry(request.query.country) : undefined;
    if (
      !country ||
      typeof category !== 'string' ||
      !['all', 'museums', 'food', 'parks', 'hotels'].includes(category) ||
      typeof query !== 'string' ||
      query.length > 80 ||
      (query.length > 0 && query.trim().length < 2)
    )
      throw new AuthError(400, 'INVALID_INPUT', 'Arama veya kategori geçersiz.');
    response.json({ items: await googlePlaces.search(country, category, query.trim()) });
  });
  router.get('/search', googleLimit, async (request, response) => {
    if (!googlePlaces)
      throw new AuthError(503, 'GOOGLE_UNAVAILABLE', 'Google mekanları hazır değil.');
    const query = request.query.query;
    if (typeof query !== 'string' || query.trim().length < 1 || query.length > 80)
      throw new AuthError(400, 'INVALID_INPUT', 'Arama 1–80 karakter olmalı.');
    response.json({ items: await googlePlaces.searchAny(query.trim()) });
  });
  router.get('/saved/details', googleLimit, async (_request, response) => {
    if (!googlePlaces)
      throw new AuthError(503, 'GOOGLE_UNAVAILABLE', 'Google mekanları hazır değil.');
    const country =
      typeof _request.query.country === 'string' ? getCountry(_request.query.country) : undefined;
    if (!country) throw new AuthError(400, 'INVALID_INPUT', 'Ülke geçersiz.');
    const saved = await domain.getSavedPlaces(response.locals.userId);
    const ids = saved
      .filter(
        (id) => id !== 'rome-collection' && !['enzo', 'doria', 'gelato', 'osteria'].includes(id),
      )
      .slice(0, 10);
    const result = await Promise.allSettled(ids.map((id) => googlePlaces.details(id)));
    response.json({
      items: result.flatMap((item) =>
        item.status === 'fulfilled' && item.value?.countryCode === country.code ? [item.value] : [],
      ),
    });
  });
  router.get('/saved', async (_request, response) => {
    response.json({ items: await domain.getSavedPlaces(response.locals.userId) });
  });
  router.put('/saved', async (request, response) => {
    response.json(await domain.setSavedPlace(response.locals.userId, request.body));
  });
  return router;
}
