import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authErrorMessage, validEmail, validateCredentials } from '../src/auth/validation';
import { accountStorageKey, createScopedStore } from '../src/storage/scopedStore';

test('signup requires name, valid email, password and consent', () => {
  assert.notEqual(validateCredentials('user@example.com', '12345678', true, '', true), '');
  assert.notEqual(validateCredentials('invalid', '12345678', true, 'Deniz', true), '');
  assert.notEqual(validateCredentials('user@example.com', '123', true, 'Deniz', true), '');
  assert.notEqual(validateCredentials('user@example.com', '12345678', true, 'Deniz', false), '');
  assert.equal(validateCredentials(' user@example.com ', '12345678', true, 'Deniz', true), '');
});

test('sign in accepts existing passwords without imposing signup length', () => {
  assert.equal(validateCredentials('user@example.com', '123456', false), '');
  assert.notEqual(validateCredentials('user@example.com', '', false), '');
  assert.equal(validEmail(' user@example.com '), true);
  assert.equal(validEmail('user@'), false);
});

test('auth errors are Turkish and do not reveal whether a login email exists', () => {
  assert.equal(
    authErrorMessage({ code: 'INVALID_CREDENTIALS' }),
    'E-posta veya şifre hatalı. Lütfen tekrar dene.',
  );
  assert.match(authErrorMessage({ code: 'NETWORK_ERROR' }), /Wi-Fi/);
  assert.match(authErrorMessage({ code: 'RATE_LIMITED' }), /15 dakika/);
  assert.match(authErrorMessage({ code: 'API_CONFIG' }), /EXPO_PUBLIC_API_URL/);
  assert.equal(
    authErrorMessage(new Error('private server details')),
    'İşlem tamamlanamadı. Lütfen tekrar dene.',
  );
});

test('local data is isolated by user, including writes pending during account switch', async () => {
  const data = new Map<string, string>([['profile', JSON.stringify('legacy')]]);
  const store = createScopedStore({
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
  });
  const decode = (value: unknown) => String(value);
  assert.throws(() => store.get('profile', '', decode));
  store.setUser('alice');
  assert.equal(await store.get('profile', '', decode), '');
  const writing = store.set('profile', 'Alice');
  store.setUser('bob');
  await writing;
  assert.equal(await store.get('profile', '', decode), '');
  await store.set('profile', 'Bob');
  store.setUser('alice');
  assert.equal(await store.get('profile', '', decode), 'Alice');
  assert.equal(data.get('profile'), JSON.stringify('legacy'));
  store.setUser(null);
  assert.throws(() => store.set('profile', 'signed out'));
  assert.notEqual(accountStorageKey('alice', 'profile'), accountStorageKey('bob', 'profile'));
});
