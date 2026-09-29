import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';

test('sunucu sağlık kontrolü, CORS ve hata yanıtları', async (context) => {
  const server = createApp(['http://localhost:8081']).listen(0, '127.0.0.1');
  context.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  );
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const health = await fetch(`${baseUrl}/health`, { headers: { Origin: 'http://localhost:8081' } });
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  assert.equal(health.headers.get('x-powered-by'), null);
  assert.deepEqual(await health.json(), {
    status: 'ok',
    service: 'wanderly-backend',
    message: 'Wanderly sunucusu çalışıyor.',
  });
  const blocked = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://example.com' } });
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
  const missing = await fetch(`${baseUrl}/missing`);
  assert.equal(missing.status, 404);
  const malformed = await fetch(`${baseUrl}/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(malformed.status, 400);
  const oversized = await fetch(`${baseUrl}/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'a'.repeat(20000) }),
  });
  assert.equal(oversized.status, 413);
});

test('port doğrulanır ve varsayılan ayarlar okunur', () => {
  assert.equal(readConfig({}).port, 3000);
  assert.equal(readConfig({ PORT: '4000' }).port, 4000);
  for (const port of ['0', '-1', 'abc', '3000.5', '65536', '']) {
    assert.throws(() => readConfig({ PORT: port }));
  }
});
