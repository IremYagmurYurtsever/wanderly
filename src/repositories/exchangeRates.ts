import { api } from '../services/api';
import { decodeExchangeRates } from '../models/exchangeRates';

export const exchangeRatesRepository = {
  async load() {
    return decodeExchangeRates(await api.request('/api/exchange/rates'));
  },
};
