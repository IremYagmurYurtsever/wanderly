export type ExchangeRates = {
  base: 'EUR';
  date: string;
  rates: { TRY: number; USD: number; GBP: number; JPY: number };
};

export function decodeExchangeRates(value: unknown): ExchangeRates {
  if (!value || typeof value !== 'object') throw new Error('Invalid exchange rates');
  const data = value as Record<string, unknown>;
  const rates = data.rates as Record<string, unknown> | undefined;
  if (
    data.base !== 'EUR' ||
    typeof data.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
    !rates ||
    !['TRY', 'USD', 'GBP', 'JPY'].every(
      (code) => typeof rates[code] === 'number' && Number.isFinite(rates[code]) && rates[code] > 0,
    )
  )
    throw new Error('Invalid exchange rates');
  return data as ExchangeRates;
}
