import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeExchangeRates } from '../src/models/exchangeRates';

test('kur verisi dört desteklenen para birimini ve tarihi doğrular', () => {
  const response = {
    base: 'EUR',
    date: '2026-09-22',
    rates: { TRY: 56.1, USD: 1.1463, GBP: 0.8578, JPY: 180.17 },
  };
  assert.deepEqual(decodeExchangeRates(response), response);
  assert.throws(() => decodeExchangeRates({ ...response, rates: { ...response.rates, TRY: 0 } }));
});
