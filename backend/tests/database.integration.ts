import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createDatabase } from '../src/database.js';
import { createApp } from '../src/app.js';
import { createAuthService } from '../src/auth/service.js';
import { createAuthRepository } from '../src/auth/repository.js';
import { createDomainService } from '../src/domain/service.js';
import { createActionService } from '../src/auth/actions.js';
import { createActionRepository } from '../src/auth/action-repository.js';

test('PostgreSQL: hesap izolasyonu, CRUD, favoriler, şifre sıfırlama ve oturum iptali', async () => {
  const target = new URL(process.env.DATABASE_URL ?? '');
  assert.ok(
    ['127.0.0.1', 'localhost'].includes(target.hostname) && target.pathname === '/wanderly',
    'Yalnızca yerel wanderly test edilebilir.',
  );
  const database = createDatabase();
  const emails = [`test-${randomUUID()}@example.invalid`, `test-${randomUUID()}@example.invalid`];
  const changedEmail = `test-changed-${randomUUID()}@example.invalid`;
  const auth = createAuthService(createAuthRepository(database));
  let resetLink = '';
  const actions = createActionService(
    createActionRepository(database),
    {
      async send(message) {
        resetLink = message.link;
      },
    },
    'http://localhost:3000',
  );
  const server = createApp([], auth, actions, createDomainService(database)).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  async function request(path: string, token: string, method = 'GET', data?: unknown) {
    return fetch(base + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }
  try {
    const users = await Promise.all(
      emails.map(async (email) => {
        await auth.register({
          email,
          name: 'Test Gezgin',
          password: 'Test-parola-123',
          agreed: true,
        });
        return auth.login({ email, password: 'Test-parola-123' });
      }),
    );
    const [first, second] = users;
    assert.equal('verified' in first.user, false);
    const profile = await request('/api/profile', first.token, 'PUT', {
      name: 'Yeni Gezgin',
      bio: '',
      currency: 'EUR',
      phone: '+90 532 123 45 67',
      preferences: ['Mimari'],
    });
    assert.equal(profile.status, 200);
    assert.equal((await profile.json()).bio, '');
    assert.equal(
      (await (await request('/api/profile', first.token)).json()).phone,
      '+905321234567',
    );
    assert.equal((await (await request('/api/profile', first.token)).json()).name, 'Yeni Gezgin');
    assert.equal((await request('/api/profile', first.token, 'PUT', { name: 42 })).status, 400);
    const createdVisa = await request('/api/visas', first.token, 'POST', {
      countryCode: 'IT',
      validFrom: '2026-10-01',
      durationDays: 90,
    });
    assert.equal(createdVisa.status, 201);
    const visa = await createdVisa.json();
    assert.equal((await (await request('/api/visas', first.token)).json()).items.length, 1);
    assert.deepEqual((await (await request('/api/visas', second.token)).json()).items, []);
    assert.equal(
      (
        await request(`/api/visas/${visa.id}`, second.token, 'PUT', {
          countryCode: 'FR',
          validFrom: '2026-10-02',
          durationDays: 30,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request(`/api/visas/${visa.id}`, first.token, 'PUT', {
          countryCode: 'FR',
          validFrom: '2026-10-02',
          durationDays: 30,
        })
      ).status,
      200,
    );
    assert.equal((await request(`/api/visas/${visa.id}`, second.token, 'DELETE')).status, 404);
    assert.equal((await request(`/api/visas/${visa.id}`, first.token, 'DELETE')).status, 200);
    const createdTrip = await request('/api/trips', first.token, 'POST', {
      destination: 'İstanbul',
      dates: '1–4 Ekim',
      countryCode: 'TR',
      startDate: '2026-10-01',
      endDate: '2026-10-04',
      stops: [
        {
          kind: 'hotel',
          placeId: 'test-hotel',
          title: 'Örnek otel',
          address: 'İstanbul',
          mapsUrl: 'https://www.google.com/maps/search/?api=1&query=otel',
        },
        {
          kind: 'hotel',
          placeId: 'test-hotel-two',
          title: 'İkinci otel',
          address: 'İstanbul',
          mapsUrl: 'https://www.google.com/maps/search/?api=1&query=otel',
        },
      ],
    });
    assert.equal(createdTrip.status, 201);
    const trip = await createdTrip.json();
    assert.equal(trip.countryCode, 'TR');
    assert.equal(trip.stops[0].title, 'Örnek otel');
    assert.equal(trip.stops.length, 2);
    assert.deepEqual((await (await request('/api/trips', second.token)).json()).items, []);
    assert.equal((await request('/api/trips/' + trip.id, second.token, 'DELETE')).status, 404);
    assert.equal(
      (
        await request('/api/memories', second.token, 'POST', {
          text: 'Başkasının gezisi',
          tripId: trip.id,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request('/api/trips/' + trip.id, first.token, 'PUT', {
          destination: 'İzmir',
          dates: '2–5 Ekim',
          countryCode: 'TR',
          startDate: '2026-10-02',
          endDate: '2026-10-05',
          budget: '1500.00',
          currency: 'EUR',
          notes: 'Tren biletini kontrol et.',
          stops: [],
        })
      ).status,
      200,
    );
    const updatedTrip = (await (await request('/api/trips', first.token)).json()).items[0];
    assert.equal(updatedTrip.startDate, '2026-10-02');
    assert.equal(updatedTrip.budget, '1500.00');
    assert.equal(updatedTrip.currency, 'EUR');
    assert.equal(updatedTrip.notes, 'Tren biletini kontrol et.');
    assert.deepEqual(updatedTrip.stops, []);
    const memoryResponse = await request('/api/memories', first.token, 'POST', {
      text: 'Güzel bir gün',
      tripId: trip.id,
    });
    assert.equal(memoryResponse.status, 201);
    const memory = await memoryResponse.json();
    assert.equal(
      (await request('/api/memories/' + memory.id, second.token, 'PUT', { text: 'İzin yok' }))
        .status,
      404,
    );
    assert.equal(
      (await request('/api/memories/' + memory.id, first.token, 'PUT', { text: 'Güncellenen anı' }))
        .status,
      200,
    );
    for (const entryId of ['sample-entry', `personal-${memory.id}`]) {
      assert.equal(
        (await request('/api/memories/favorites', first.token, 'PUT', { entryId, selected: true }))
          .status,
        200,
      );
    }
    assert.equal(
      (await (await request('/api/memories/favorites', first.token)).json()).items.length,
      2,
    );
    assert.deepEqual(
      (await (await request('/api/memories/favorites', second.token)).json()).items,
      [],
    );
    const saves = await Promise.all(
      Array.from({ length: 3 }, () =>
        request('/api/places/saved', first.token, 'PUT', { placeId: 'rome-place', selected: true }),
      ),
    );
    assert.ok(saves.every((response) => response.status === 200));
    assert.deepEqual((await (await request('/api/places/saved', first.token)).json()).items, [
      'rome-place',
    ]);
    assert.deepEqual((await (await request('/api/places/saved', second.token)).json()).items, []);
    assert.equal(
      (
        await request('/api/places/saved', first.token, 'PUT', {
          placeId: 'rome-place',
          selected: false,
        })
      ).status,
      200,
    );
    assert.equal((await request('/api/trips/' + trip.id, first.token, 'DELETE')).status, 200);
    assert.equal(
      (await (await request('/api/memories', first.token)).json()).items[0].tripId,
      null,
    );
    assert.equal((await request('/api/memories/' + memory.id, first.token, 'DELETE')).status, 200);
    await actions.requestReset({ email: emails[0] });
    const token = new URL(resetLink).searchParams.get('token');
    await actions.reset(token, 'Yeni-parola-123');
    await assert.rejects(actions.reset(token, 'Yeni-parola-123'));
    assert.equal((await request('/api/profile', first.token)).status, 401);
    assert.ok((await auth.login({ email: emails[0], password: 'Yeni-parola-123' })).token);
    const fresh = await auth.login({ email: emails[0], password: 'Yeni-parola-123' });
    assert.equal(
      (
        await request('/api/profile/email', fresh.token, 'PUT', {
          email: changedEmail,
          password: 'yanlış-şifre',
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request('/api/profile/email', fresh.token, 'PUT', {
          email: emails[1],
          password: 'Yeni-parola-123',
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await request('/api/profile/email', fresh.token, 'PUT', {
          email: changedEmail,
          password: 'Yeni-parola-123',
        })
      ).status,
      200,
    );
    assert.equal((await auth.me(`Bearer ${fresh.token}`)).user.email, changedEmail);
    await assert.rejects(auth.login({ email: emails[0], password: 'Yeni-parola-123' }));
    assert.ok((await auth.login({ email: changedEmail, password: 'Yeni-parola-123' })).token);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
    await database.user.deleteMany({ where: { email: { in: [...emails, changedEmail] } } });
    await database.$disconnect();
  }
});
