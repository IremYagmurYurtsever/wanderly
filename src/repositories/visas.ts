import { authController } from '../auth/runtime';
import { decodeVisas, type VisaDraft } from '../models/visa';

export const visaRepository = {
  async load() {
    const result = await authController.request('/api/visas');
    return decodeVisas(result.items);
  },
  add: (draft: VisaDraft) => authController.request('/api/visas', draft),
  update: (id: string, draft: VisaDraft) =>
    authController.request(`/api/visas/${encodeURIComponent(id)}`, draft, 'PUT'),
  delete: (id: string) =>
    authController.request(`/api/visas/${encodeURIComponent(id)}`, undefined, 'DELETE'),
};
