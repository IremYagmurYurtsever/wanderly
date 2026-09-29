import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import type { User } from '../src/generated/prisma/client.js';
import type { AuthRepository } from '../src/auth/repository.js';
import { createAuthService, tokenDigest } from '../src/auth/service.js';
import { hashPassword, verifyPassword } from '../src/auth/password.js';
import { readCredentials } from '../src/auth/validation.js';

function memoryRepository() {
  const users = new Map<string, User>();
  const sessions = new Map<string, { userId: string; expiresAt: Date }>();
  const repository: AuthRepository = {
    async createUser(data) {
      if (users.has(data.email)) throw { code: 'P2002' };
      const user: User = {
        ...data,
        id: randomUUID(),
        bio: null,
        preferences: [],
        journalFavorites: [],
        currency: 'TRY',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.set(data.email, user);
      return user;
    },
    async findUser(email) {
      return users.get(email) ?? null;
    },
    async createSession(userId, tokenHash, expiresAt) {
      sessions.set(tokenHash, { userId, expiresAt });
    },
    async sessionUser(tokenHash, now) {
      const session = sessions.get(tokenHash);
      return session && session.expiresAt > now
        ? ([...users.values()].find((user) => user.id === session.userId) ?? null)
        : null;
    },
    async revokeSession(tokenHash) {
      sessions.delete(tokenHash);
    },
  };
  return { repository, users, sessions };
}

test('girdi doğrulama ve parola boşluklarının korunması', () => {
  const valid = {
    name: ' Deniz ',
    email: ' DENIZ@EXAMPLE.COM ',
    password: ' password ',
    agreed: true,
  };
  assert.deepEqual(readCredentials(valid, true), {
    name: 'Deniz',
    email: 'deniz@example.com',
    password: ' password ',
  });
  for (const body of [
    null,
    [],
    {},
    { ...valid, agreed: 'true' },
    { ...valid, name: 'x' },
    { ...valid, email: 'yanlış' },
    { ...valid, password: 'short' },
    { ...valid, password: 'a'.repeat(129) },
  ]) {
    assert.throws(() => readCredentials(body, true));
  }
});

test('scrypt farklı tuz üretir; doğru ve yanlış parola ayrılır', async () => {
  const first = await hashPassword('Deneme-parolası-123');
  const second = await hashPassword('Deneme-parolası-123');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('Deneme-parolası-123', first), true);
  assert.equal(await verifyPassword('yanlış', first), false);
  assert.equal(await verifyPassword('test', 'bozuk-özet'), false);
});

test('HTTP kayıt, giriş, kimlik, çıkış, süre dolumu ve tekrar kayıt', async (context) => {
  const memory = memoryRepository();
  let clock = new Date('2026-09-21T12:00:00Z');
  const service = createAuthService(memory.repository, () => clock);
  const server = createApp([], service).listen(0, '127.0.0.1');
  context.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/auth`;
  const post = (route: string, body: unknown) =>
    fetch(base + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  const credentials = {
    email: ' DENIZ@EXAMPLE.COM ',
    password: 'Deneme-parolası-123',
    name: 'Deniz',
    agreed: true,
  };
  const registered = await post('/register', credentials);
  assert.equal(registered.status, 201);
  assert.equal(registered.headers.get('cache-control'), 'no-store');
  const registration = await registered.json();
  assert.deepEqual(Object.keys(registration.user).sort(), ['email', 'id', 'name']);
  assert.equal(registration.user.email, 'deniz@example.com');
  assert.equal('verified' in registration.user, false);
  assert.notEqual(memory.users.get('deniz@example.com')?.passwordHash, credentials.password);
  assert.equal((await post('/register', credentials)).status, 409);
  const wrong = await post('/login', { ...credentials, password: 'yanlış' });
  const unknown = await post('/login', { ...credentials, email: 'missing@example.com' });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(await wrong.json(), await unknown.json());
  assert.equal((await fetch(base + '/me')).status, 401);
  const loginResponse = await post('/login', credentials);
  assert.equal(loginResponse.status, 200);
  const login = await loginResponse.json();
  assert.match(login.token, /^[a-f0-9]{64}$/);
  assert.equal(memory.sessions.has(login.token), false);
  assert.equal(memory.sessions.has(tokenDigest(login.token)), true);
  const headers = { Authorization: `Bearer ${login.token}` };
  const me = await fetch(base + '/me', { headers });
  assert.equal(me.status, 200);
  assert.deepEqual((await me.json()).user, registration.user);
  const logout = await fetch(base + '/logout', { method: 'POST', headers });
  assert.equal(logout.status, 204);
  assert.equal((await fetch(base + '/me', { headers })).status, 401);
  const another = await (await post('/login', credentials)).json();
  assert.notEqual(login.token, another.token);
  clock = new Date(another.expiresAt);
  assert.equal(
    (await fetch(base + '/me', { headers: { Authorization: `Bearer ${another.token}` } })).status,
    401,
  );
  assert.equal(
    (await fetch(base + '/me', { headers: { Authorization: 'Bearer fake' } })).status,
    401,
  );
});

test('fazla giriş denemesi engellenir', async (context) => {
  const server = createApp([], createAuthService(memoryRepository().repository)).listen(
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
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/auth`;
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await fetch(base + '/login', { method: 'POST' });
    assert.equal(response.status, 400);
    await response.arrayBuffer();
  }
  const blocked = await fetch(base + '/register', { method: 'POST' });
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'));
});
