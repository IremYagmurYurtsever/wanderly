import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createExchangeRateService, parseExchangeRates } from '../src/exchange/rates.js';

const xml = `<Cube><Cube time='2026-09-22'><Cube currency='USD' rate='1.1463'/><Cube currency='JPY' rate='180.17'/><Cube currency='GBP' rate='0.85780'/><Cube currency='TRY' rate='56.1'/></Cube></Cube>`;

test('ECB verisinden tarih ve dört EUR kuru alınır', () => {
  assert.deepEqual(parseExchangeRates(xml), {
    base: 'EUR',
    date: '2026-09-22',
    rates: { TRY: 56.1, USD: 1.1463, GBP: 0.8578, JPY: 180.17 },
  });
  assert.throws(() => parseExchangeRates(xml.replace("<Cube currency='TRY' rate='56.1'/>", '')), {
    code: 'EXCHANGE_UNAVAILABLE',
  });
});

test('kurlar önbelleklenir; kaynak kesilirse son doğrulanmış değer korunur', async () => {
  let time = 1000;
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    if (calls > 1) throw new Error('network');
    return new Response(xml, { status: 200 });
  };
  const service = createExchangeRateService(fetcher as typeof fetch, () => time);
  const first = await service.load();
  assert.equal((await service.load()).date, first.date);
  assert.equal(calls, 1);
  time += 60 * 60 * 1000;
  assert.deepEqual(await service.load(), first);
  assert.equal(calls, 2);
});
