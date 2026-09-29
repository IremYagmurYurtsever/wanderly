import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ApiError,
  createApiClient,
  resolveApiUrl,
  type ApiClient,
} from '../src/services/api/client';
import { createAuthController } from '../src/auth/controller';

const sessionToken = 'a'.repeat(64);
const user = { id: 'user-1', email: 'demo@example.invalid', name: 'Demo' };
function setup(request: ApiClient['request'], initial: string | null = null) {
  let saved = initial;
  let scope: string | null = null;
  const store = {
    async get() {
      return saved;
    },
    async set(value: string) {
      saved = value;
    },
    async clear() {
      saved = null;
    },
  };
  const controller = createAuthController({ request }, store, (next) => {
    scope = next;
  });
  return { controller, saved: () => saved, scope: () => scope };
}

test('API adresi Expo bilgisayarından bulunur; yayın sürümünde HTTPS gerekir', () => {
  assert.equal(resolveApiUrl(undefined, '10.81.1.78:8081', true), 'http://10.81.1.78:3000');
  assert.equal(resolveApiUrl(undefined, '192.168.1.10:8081', true), 'http://192.168.1.10:3000');
  assert.throws(() => resolveApiUrl(undefined, undefined, true), { code: 'API_CONFIG' });
  assert.throws(() => resolveApiUrl('  ', undefined, true), { code: 'API_CONFIG' });
  assert.equal(
    resolveApiUrl('https://api.example.com', undefined, false),
    'https://api.example.com',
  );
  assert.throws(() => resolveApiUrl(undefined, 'localhost', false));
  assert.throws(() => resolveApiUrl('http://api.example.com', undefined, false));
  assert.throws(() => resolveApiUrl('https://user:secret@example.com', undefined, true));
});

test('API isteği bearer başlığı, hata kodu ve zaman aşımı', async () => {
  const requests: RequestInit[] = [];
  const client = createApiClient(
    () => 'http://localhost:3000',
    async (_url, options) => {
      requests.push(options!);
      return new Response(null, { status: 204 });
    },
  );
  await client.request('/auth/logout', {}, sessionToken);
  assert.equal(
    (requests[0].headers as Record<string, string>).Authorization,
    `Bearer ${sessionToken}`,
  );
  assert.equal(requests[0].credentials, 'omit');
  await client.request('/api/profile', { name: 'Demo' }, sessionToken, 'PUT');
  assert.equal(requests[1].method, 'PUT');
  const failed = createApiClient(
    () => 'http://localhost:3000',
    async () =>
      new Response(JSON.stringify({ code: 'UNAUTHORIZED', error: 'private details' }), {
        status: 401,
      }),
  );
  await assert.rejects(
    failed.request('/auth/me'),
    (error: unknown) =>
      error instanceof ApiError &&
      error.status === 401 &&
      error.code === 'UNAUTHORIZED' &&
      !error.message.includes('private'),
  );
  const invalid = createApiClient(
    () => 'http://localhost:3000',
    async () => new Response('<html>'),
  );
  await assert.rejects(invalid.request('/auth/me'), { code: 'INVALID_RESPONSE' });
  const timeout = createApiClient(
    () => 'http://localhost:3000',
    async (_url, options) =>
      new Promise((_resolve, reject) => {
        options!.signal!.addEventListener('abort', () => reject(new Error('aborted')));
      }),
    5,
  );
  await assert.rejects(timeout.request('/auth/me'), { code: 'TIMEOUT' });
});

test('kayıt sonrası giriş, şifre sıfırlama ve çıkış backend kullanır', async () => {
  const calls: string[] = [];
  const state = setup(async (path, _body, token) => {
    calls.push(path);
    if (path === '/auth/register') return { user, message: 'Demo: e-posta gönderilmedi.' };
    if (path === '/auth/login') return { user, token: sessionToken };
    if (path === '/auth/password/forgot') return { message: 'Demo bağlantısı terminalde.' };
    assert.equal(token, sessionToken);
    if (path === '/auth/me') return { user };
    return {};
  });
  await state.controller.initialize();
  assert.equal(
    await state.controller.submit(user.email, 'Test-parola-123', true, 'Demo', true),
    true,
  );
  assert.deepEqual(calls, ['/auth/register', '/auth/login']);
  assert.equal(state.saved(), sessionToken);
  assert.equal(state.scope(), 'backend:user-1');
  await state.controller.resetPassword(user.email);
  assert.match(state.controller.getState().message, /terminalde/);
  await state.controller.logout();
  assert.equal(state.saved(), null);
  assert.equal(state.scope(), null);
  assert.equal(state.controller.getState().session, null);
});

test('kayıtlı oturum sunucuda doğrulanır; iptal edilirse depodan silinir', async () => {
  let revoked = false;
  const state = setup(async () => {
    if (revoked) throw new ApiError('UNAUTHORIZED', 401);
    return { user };
  }, sessionToken);
  await state.controller.initialize();
  assert.equal(state.scope(), 'backend:user-1');
  revoked = true;
  await state.controller.revalidate();
  assert.equal(state.saved(), null);
  assert.equal(state.controller.getState().session, null);
});

test('başlangıçta ağ hatası oturumu silmez veya özel ekranları açmaz; tekrar denenir', async () => {
  let offline = true;
  const state = setup(async () => {
    if (offline) throw new ApiError('NETWORK_ERROR');
    return { user };
  }, sessionToken);
  await state.controller.initialize();
  assert.equal(state.controller.getState().restoreFailed, true);
  assert.equal(state.saved(), sessionToken);
  assert.equal(state.scope(), null);
  offline = false;
  await state.controller.retryRestore();
  assert.equal(state.controller.getState().restoreFailed, false);
  assert.equal(state.scope(), 'backend:user-1');
});

test('kayıt başarılı giriş başarısızsa hesabın oluşturulduğu bildirilir', async () => {
  const state = setup(async (path) => {
    if (path === '/auth/register') return { user };
    throw new ApiError('NETWORK_ERROR');
  });
  await state.controller.initialize();
  assert.equal(
    await state.controller.submit(user.email, 'Test-parola-123', true, 'Demo', true),
    false,
  );
  assert.match(state.controller.getState().message, /Hesabın oluşturuldu/);
  assert.equal(state.saved(), null);
});
