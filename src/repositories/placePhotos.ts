import { authController } from '../auth/runtime';
import { enqueueWikimedia } from './wikimediaQueue';

export type PlacePhoto = {
  url: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
};

export const placePhotoRepository = {
  load(title: string, country: string, signal?: AbortSignal): Promise<PlacePhoto | null> {
    const path = `/api/places/photo?title=${encodeURIComponent(title)}&country=${encodeURIComponent(country)}`;
    return enqueueWikimedia(async () => {
      if (signal?.aborted) return null;
      const result = await authController.request(path);
      const photo = result.photo;
      if (!photo || typeof photo !== 'object') return null;
      const value = photo as Record<string, unknown>;
      if (
        typeof value.url !== 'string' ||
        typeof value.sourceUrl !== 'string' ||
        typeof value.author !== 'string' ||
        typeof value.license !== 'string' ||
        typeof value.licenseUrl !== 'string'
      )
        return null;
      return value as PlacePhoto;
    });
  },
};
