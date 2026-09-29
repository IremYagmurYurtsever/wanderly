import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { AuthError } from '../src/auth/validation.js';
import type { AuthService } from '../src/auth/service.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { createDomainService } from '../src/domain/service.js';
import {
  profileInput,
  tripInput,
  memoryInput,
  visaInput,
  phoneNumber,
  uuid,
  boolean,
} from '../src/domain/validation.js';

test('domain girdileri hatalı tipleri, uzun metni ve geçersiz kimlikleri reddeder', () => {
  for (const value of [
    null,
    [],
    { name: 42 },
    { name: '' },
    { bio: 'x'.repeat(1001) },
    { avatarDataUrl: 'https://example.com/avatar.jpg' },
    { currency: 'BTC' },
    { preferences: [42] },
  ])
    assert.throws(() => profileInput(value));
  for (const value of [
    null,
    [],
    {},
    { destination: 42, dates: 'yarın' },
    { destination: 'x'.repeat(201), dates: 'yarın' },
  ])
    assert.throws(() => tripInput(value));
  assert.throws(() => uuid('not-an-id'));
  assert.throws(() => boolean('false'));
  assert.deepEqual(profileInput({ bio: '', currency: 'TRY', preferences: ['Mimari', 'Mimari'] }), {
    bio: '',
    currency: 'TRY',
    preferences: ['Mimari'],
  });
});

test('gezi planı tarih, ülke ve durak kurallarını uygular', () => {
  const base = { destination: 'Roma', dates: '12–18 Ekim' };
  const stop = {
    kind: 'place',
    placeId: 'rome-colosseum',
    title: 'Kolezyum',
    address: 'Roma',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kolezyum',
  };
  assert.deepEqual(
    tripInput({
      ...base,
      countryCode: 'IT',
      startDate: '2026-10-12',
      endDate: '2026-10-18',
      stops: [stop],
    }).stops,
    [stop],
  );
  const hotel = { ...stop, kind: 'hotel', title: 'Otel' };
  assert.equal(
    tripInput({
      ...base,
      stops: [
        { ...hotel, placeId: 'hotel-one' },
        { ...hotel, placeId: 'hotel-two' },
      ],
    }).stops?.length,
    2,
  );
  for (const extra of [
    { startDate: '2026-02-30', endDate: '2026-03-01' },
    { startDate: '2026-10-18', endDate: '2026-10-12' },
    { startDate: '2026-10-12' },
    { startDate: '2026-10-12', endDate: '2027-10-13' },
    { countryCode: 'XX' },
    { stops: [stop, stop] },
    { stops: [{ ...stop, mapsUrl: 'https://example.com' }] },
    { stops: Array.from({ length: 11 }, (_, index) => ({ ...hotel, placeId: `hotel-${index}` })) },
  ])
    assert.throws(() => tripInput({ ...base, ...extra }));
});

test('günlük anısı tarihi, mekânı ve fotoğrafı doğrular', () => {
  assert.deepEqual(
    memoryInput({ text: 'Bir gün', placeName: '  Kafe  ', visitedAt: '2026-09-25' }),
    {
      text: 'Bir gün',
      placeName: 'Kafe',
      visitedAt: '2026-09-25',
    },
  );
  for (const extra of [
    { visitedAt: '2026-02-30' },
    { placeName: 'a'.repeat(201) },
    { photoDataUrl: 'https://example.com/photo.jpg' },
    { photoDataUrl: 'data:image/png;base64,abcd' },
    { photoDataUrl: `data:image/jpeg;base64,${'a'.repeat(1_500_000)}` },
  ])
    assert.throws(() => memoryInput({ text: 'Anı', ...extra }));
});

test('profil telefonu ve vize süresi doğrulanır', () => {
  assert.equal(phoneNumber(' +90 (532) 123-45-67 '), '+905321234567');
  assert.equal(phoneNumber(''), null);
  assert.deepEqual(visaInput({ countryCode: 'it', validFrom: '2026-09-25', durationDays: 90 }), {
    countryCode: 'IT',
    validFrom: '2026-09-25',
    durationDays: 90,
  });
  for (const input of [
    { countryCode: 'XX', validFrom: '2026-09-25', durationDays: 90 },
    { countryCode: 'IT', validFrom: '2026-02-30', durationDays: 90 },
    { countryCode: 'IT', validFrom: '2026-09-25', durationDays: 0 },
    { countryCode: 'IT', validFrom: '2026-09-25', durationDays: 3651 },
  ])
    assert.throws(() => visaInput(input));
});

test('gerçek domain rotaları oturum ister ve oturum sahibinin kimliğini kullanır', async (context) => {
  let owner = '';
  const auth = {
    async me(header: string | undefined) {
      if (header !== 'Bearer test') throw new AuthError(401, 'UNAUTHORIZED', 'Giriş yap.');
      return { user: { id: 'owner', name: 'Demo', email: 'demo@example.invalid' } };
    },
  } as AuthService;
  const database = {
    trip: {
      async findMany(query: { where: { userId: string } }) {
        owner = query.where.userId;
        return [];
      },
    },
  } as unknown as PrismaClient;
  const server = createApp([], auth, undefined, createDomainService(database)).listen(
    0,
    '127.0.0.1',
  );
  context.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  for (const path of [
    '/api/profile',
    '/api/trips',
    '/api/memories',
    '/api/places/saved',
    '/api/memories/favorites',
  ])
    assert.equal((await fetch(base + path)).status, 401);
  const response = await fetch(base + '/api/trips?userId=someone-else', {
    headers: { Authorization: 'Bearer test' },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { items: [] });
  assert.equal(owner, 'owner');
  assert.equal((await fetch(base + '/account/verify')).status, 404);
  assert.equal((await fetch(base + '/auth/verification/request', { method: 'POST' })).status, 404);
});
