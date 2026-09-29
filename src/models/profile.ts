export type Profile = {
  name: string;
  email: string;
  phone: string | null;
  bio: string;
  avatarDataUrl: string | null;
  preferences: string[];
  currency: string;
  updatedAt: string | null;
};

export function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.charAt(0) ?? ''}${parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? '') : ''}`.toLocaleUpperCase(
    'tr-TR',
  );
}

export function defaultProfile(name = ''): Profile {
  return {
    name: name.trim() || 'Meraklı Gezgin',
    email: '',
    phone: null,
    bio: '',
    avatarDataUrl: null,
    preferences: [],
    currency: 'TRY',
    updatedAt: null,
  };
}

export function decodeProfile(value: unknown): Profile {
  if (!value || typeof value !== 'object') throw new Error('Invalid profile');
  const profile = value as Partial<Profile>;
  if (
    typeof profile.name !== 'string' ||
    (profile.email !== undefined && typeof profile.email !== 'string') ||
    (profile.phone != null && typeof profile.phone !== 'string') ||
    typeof profile.bio !== 'string' ||
    (profile.avatarDataUrl != null && typeof profile.avatarDataUrl !== 'string') ||
    !Array.isArray(profile.preferences) ||
    !profile.preferences.every((item) => typeof item === 'string') ||
    !['TRY', 'EUR', 'USD', 'GBP', 'JPY'].includes(profile.currency || '') ||
    !(
      profile.updatedAt === null ||
      (typeof profile.updatedAt === 'string' && Number.isFinite(Date.parse(profile.updatedAt)))
    )
  )
    throw new Error('Invalid profile');
  return {
    ...profile,
    email: profile.email ?? '',
    phone: profile.phone ?? null,
    avatarDataUrl: profile.avatarDataUrl ?? null,
  } as Profile;
}
