import { AuthError } from '../auth/validation.js';

export type ExchangeRates = {
  base: 'EUR';
  date: string;
  rates: { TRY: number; USD: number; GBP: number; JPY: number };
};

const source = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const currencies = ['TRY', 'USD', 'GBP', 'JPY'] as const;
const cacheDuration = 60 * 60 * 1000;

export function parseExchangeRates(xml: string): ExchangeRates {
  const date = xml.match(/<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]\s*>/)?.[1];
  if (!date) throw new AuthError(503, 'EXCHANGE_UNAVAILABLE', 'Kur verisi okunamadı.');
  const rates = {} as ExchangeRates['rates'];
  for (const currency of currencies) {
    const value = xml.match(
      new RegExp(`<Cube\\s+currency=['"]${currency}['"]\\s+rate=['"]([^'"]+)['"]\\s*/>`),
    )?.[1];
    const rate = Number(value);
    if (!value || !Number.isFinite(rate) || rate <= 0)
      throw new AuthError(503, 'EXCHANGE_UNAVAILABLE', 'Kur verisi eksik.');
    rates[currency] = rate;
  }
  return { base: 'EUR', date, rates };
}

export function createExchangeRateService(fetcher: typeof fetch = fetch, now = Date.now) {
  let cached: ExchangeRates | null = null;
  let checkedAt = 0;
  let pending: Promise<ExchangeRates> | null = null;

  async function refresh() {
    try {
      const response = await fetcher(source, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('ECB request failed');
      const result = parseExchangeRates(await response.text());
      cached = result;
      checkedAt = now();
      return result;
    } catch {
      if (cached) return cached;
      throw new AuthError(503, 'EXCHANGE_UNAVAILABLE', 'Kurlar şu anda alınamıyor.');
    }
  }

  return {
    load() {
      if (cached && now() - checkedAt < cacheDuration) return Promise.resolve(cached);
      if (pending) return pending;
      pending = refresh().finally(() => {
        pending = null;
      });
      return pending;
    },
  };
}

export type ExchangeRateService = ReturnType<typeof createExchangeRateService>;
