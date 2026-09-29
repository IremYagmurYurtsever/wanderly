import { authController } from '../auth/runtime';
import { enqueueWikimedia } from './wikimediaQueue';

export type PlaceSummary = { text: string; sourceUrl: string };

export const placeSummaryRepository = {
  load(title: string, country: string, signal?: AbortSignal): Promise<PlaceSummary | null> {
    const path = `/api/places/summary?title=${encodeURIComponent(title)}&country=${encodeURIComponent(country)}`;
    return enqueueWikimedia(async () => {
      if (signal?.aborted) return null;
      const result = await authController.request(path);
      const value = result.summary;
      if (!value || typeof value !== 'object') return null;
      const summary = value as Record<string, unknown>;
      if (typeof summary.text !== 'string' || typeof summary.sourceUrl !== 'string') return null;
      return { text: summary.text, sourceUrl: summary.sourceUrl };
    });
  },
};
