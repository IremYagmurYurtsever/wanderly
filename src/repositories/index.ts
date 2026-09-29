import { authController } from '../auth/runtime';
import { ApiError } from '../services/api/client';
import { storage, storageKeys, exportLocalData } from '../storage';
import { decodeHome, defaultHome, type HomePreferences, type Trip } from '../models/trip';
import { decodeMemories, decodeStringList, type MemoryDraft } from '../models/memory';
import { decodeProfile, type Profile } from '../models/profile';
import { visaRepository } from './visas';

export const profileRepository = {
  load: async () => decodeProfile(await authController.request('/api/profile')),
  update: async (patch: Partial<Profile>) =>
    decodeProfile(await authController.request('/api/profile', patch, 'PUT')),
  changeEmail: async (email: string, password: string) =>
    decodeProfile(await authController.request('/api/profile/email', { email, password }, 'PUT')),
};

export const homeRepository = {
  async load() {
    const [local, result] = await Promise.all([
      storage.get(storageKeys.home, defaultHome, decodeHome),
      authController.request('/api/trips'),
    ]);
    if (!Array.isArray(result.items)) throw new ApiError('INVALID_RESPONSE');
    const data = decodeHome({ ...local, trips: result.items });
    return { ...data, trip: data.trips.at(-1) ?? defaultHome.trip };
  },
  updatePreferences: (patch: Partial<HomePreferences>) =>
    storage.update(storageKeys.home, defaultHome, decodeHome, (current) => ({
      ...current,
      ...patch,
    })),
  async addTrip(draft: Trip) {
    const result = await authController.request('/api/trips', draft);
    return decodeHome({ ...defaultHome, trips: [result] }).trips[0];
  },
  updateTrip: (id: string, draft: Trip) =>
    authController.request(`/api/trips/${encodeURIComponent(id)}`, draft, 'PUT'),
  deleteTrip: (id: string) =>
    authController.request(`/api/trips/${encodeURIComponent(id)}`, undefined, 'DELETE'),
};

export const memoryRepository = {
  async load() {
    const result = await authController.request('/api/memories');
    return decodeMemories(result.items);
  },
  add: (draft: MemoryDraft) => authController.request('/api/memories', draft),
  update: (id: string, draft: MemoryDraft) =>
    authController.request(`/api/memories/${encodeURIComponent(id)}`, draft, 'PUT'),
  delete: (id: string) =>
    authController.request(`/api/memories/${encodeURIComponent(id)}`, undefined, 'DELETE'),
};

function selectionPath(key: string) {
  if (key === storageKeys.savedPlaces) return '/api/places/saved';
  if (key === storageKeys.journalFavorites) return '/api/memories/favorites';
  throw new Error('Bilinmeyen seçim türü.');
}
export const selectionRepository = {
  async load(key: string) {
    const result = await authController.request(selectionPath(key));
    return decodeStringList(result.items);
  },
  async set(key: string, id: string, selected: boolean) {
    const field = key === storageKeys.savedPlaces ? 'placeId' : 'entryId';
    await authController.request(selectionPath(key), { [field]: id, selected }, 'PUT');
  },
};

export async function exportAccountData() {
  const owner = authController.getState().session?.uid;
  const [profile, home, memories, savedPlaces, journalFavorites, visas, legacyLocal] =
    await Promise.all([
      profileRepository.load(),
      homeRepository.load(),
      memoryRepository.load(),
      selectionRepository.load(storageKeys.savedPlaces),
      selectionRepository.load(storageKeys.journalFavorites),
      visaRepository.load(),
      exportLocalData(),
    ]);
  if (!owner || owner !== authController.getState().session?.uid)
    throw new Error('Oturum değişti.');
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    profile,
    trips: home.trips,
    memories,
    savedPlaces,
    journalFavorites,
    visas,
    legacyLocal,
  };
}
