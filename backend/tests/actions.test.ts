import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { createActionService } from '../src/auth/actions.js';
import {
  readDeliveryConfig,
  createDemoDelivery,
  type ActionMessage,
} from '../src/auth/delivery.js';
import type { ActionRepository } from '../src/auth/action-repository.js';
import { tokenDigest } from '../src/auth/service.js';
import { verifyPassword } from '../src/auth/password.js';

function setup() {
  let clock = new Date('2026-09-21T12:00:00Z');
  const user = {
    id: 'user',
    name: 'Demo',
    email: 'demo@example.invalid',
    passwordHash: '',
    bio: null,
    preferences: [],
    journalFavorites: [],
    currency: 'TRY',
    createdAt: clock,
    updatedAt: clock,
  };
  const tokens = new Map<string, Parameters<ActionRepository['issue']>[0]>();
  const messages: ActionMessage[] = [];
  const repository: ActionRepository = {
    async findUser(email) {
      return email === user.email ? user : null;
    },
    async issue(data) {
      for (const entry of tokens.values()) {
        if (
          entry.kind === data.kind &&
          entry.createdAt.getTime() > data.createdAt.getTime() - 60000
        )
          return false;
      }
      for (const [key, entry] of tokens) if (entry.kind === data.kind) tokens.delete(key);
      tokens.set(data.tokenHash, data);
      return true;
    },
    async consume(hash, kind, now, passwordHash) {
      const token = tokens.get(hash);
      if (!token || token.kind !== kind || token.expiresAt <= now) return false;
      tokens.delete(hash);
      user.passwordHash = passwordHash!;
      return true;
    },
  };
  const actions = createActionService(
    repository,
    {
      async send(message) {
        messages.push(message);
      },
    },
    'http://localhost:3000',
    () => clock,
  );
  return {
    actions,
    messages,
    tokens,
    user,
    advance: (milliseconds: number) => {
      clock = new Date(clock.getTime() + milliseconds);
    },
  };
}

test('demo yapılandırması production ve genel adreslerde kapalıdır', async () => {
  assert.equal(readDeliveryConfig({}).mode, 'disabled');
  assert.throws(() => readDeliveryConfig({ MAIL_MODE: 'demo', NODE_ENV: 'production' }));
  assert.throws(() => readDeliveryConfig({ MAIL_MODE: 'smtp' }));
  assert.throws(() =>
    readDeliveryConfig({ MAIL_MODE: 'demo', PUBLIC_BASE_URL: 'https://example.com' }),
  );
  const output: string[] = [];
  await createDemoDelivery((line) => output.push(line)).send({
    email: 'test@example.invalid',
    kind: 'RESET_PASSWORD',
    link: 'http://localhost:3000/account/reset?token=test',
  });
  assert.match(output[0], /E-POSTA GÖNDERİLMEDİ/);
});

test('sıfırlama: özet depolama, yeniden isteme sınırı ve tek kullanım', async () => {
  const state = setup();
  const response = await state.actions.requestReset({ email: state.user.email });
  assert.equal(response.delivery, 'demo');
  assert.equal('token' in response, false);
  const token = new URL(state.messages[0].link).searchParams.get('token')!;
  assert.ok(state.tokens.has(tokenDigest(token)));
  assert.equal(state.tokens.has(token), false);
  await state.actions.requestReset({ email: state.user.email });
  assert.equal(state.messages.length, 1);
  await assert.rejects(state.actions.reset(token, 'kısa'));
  const results = await Promise.allSettled([
    state.actions.reset(token, 'Yeni-parola-123'),
    state.actions.reset(token, 'Yeni-parola-123'),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.ok(state.user.passwordHash);
  await assert.rejects(state.actions.reset(token, 'Yeni-parola-123'));
});

test('şifre sıfırlama: aynı yanıt, süre dolumu, yeni bağlantı ve parola özeti', async () => {
  const state = setup();
  const unknown = await state.actions.requestReset({ email: 'unknown@example.invalid' });
  const known = await state.actions.requestReset({ email: state.user.email });
  assert.deepEqual(known, unknown);
  const old = new URL(state.messages[0].link).searchParams.get('token')!;
  state.advance(30 * 60000);
  await assert.rejects(state.actions.reset(old, 'Yeni-parola-123'));
  await state.actions.requestReset({ email: state.user.email });
  const token = new URL(state.messages[1].link).searchParams.get('token')!;
  await assert.rejects(state.actions.reset(token, 'kısa'));
  await state.actions.reset(token, 'Yeni-parola-123');
  assert.equal(await verifyPassword('Yeni-parola-123', state.user.passwordHash), true);

  await assert.rejects(state.actions.reset(token, 'Baska-parola-123'));
});

test('tarayıcı GET şifreyi değiştirmez; POST tek kullanımlık sıfırlar', async (context) => {
  const state = setup();
  await state.actions.requestReset({ email: state.user.email });
  const token = new URL(state.messages[0].link).searchParams.get('token')!;
  const server = createApp([], undefined, state.actions).listen(0, '127.0.0.1');
  context.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const form = await fetch(`${base}/account/reset?token=${token}`);
  assert.equal(form.status, 200);
  assert.equal(form.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(form.headers.get('cache-control'), 'no-store');
  assert.match(await form.text(), /DEMO MODU/);

  const confirmed = await fetch(`${base}/account/reset`, {
    method: 'POST',
    body: new URLSearchParams({
      token,
      password: 'Yeni-parola-123',
      confirmation: 'Yeni-parola-123',
    }),
  });
  assert.equal(confirmed.status, 200);
  assert.match(await confirmed.text(), /Şifren yenilendi/);
  assert.ok(state.user.passwordHash);
  const reused = await fetch(`${base}/account/reset`, {
    method: 'POST',
    body: new URLSearchParams({
      token,
      password: 'Yeni-parola-123',
      confirmation: 'Yeni-parola-123',
    }),
  });
  assert.equal(reused.status, 400);
  const invalid = await fetch(`${base}/account/reset?token=%3Cscript%3E`);
  assert.equal(invalid.status, 400);
  assert.doesNotMatch(await invalid.text(), /<script>/);
});
