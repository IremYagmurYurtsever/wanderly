export type Memory = {
  id: string;
  text: string;
  createdAt: string;
  tripId: string | null;
  placeName: string | null;
  visitedAt: string | null;
  photoDataUrl: string | null;
};
export type MemoryDraft = Pick<
  Memory,
  'text' | 'tripId' | 'placeName' | 'visitedAt' | 'photoDataUrl'
>;

export function decodeMemories(value: unknown): Memory[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (memory) =>
        memory &&
        typeof memory === 'object' &&
        typeof memory.id === 'string' &&
        typeof memory.text === 'string' &&
        typeof memory.createdAt === 'string' &&
        Number.isFinite(Date.parse(memory.createdAt)) &&
        (memory.tripId == null || typeof memory.tripId === 'string') &&
        (memory.placeName == null || typeof memory.placeName === 'string') &&
        (memory.visitedAt == null || typeof memory.visitedAt === 'string') &&
        (memory.photoDataUrl == null || typeof memory.photoDataUrl === 'string'),
    )
  )
    throw new Error('Invalid memories');
  return value as Memory[];
}

export function decodeStringList(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string'))
    throw new Error('Invalid selection');
  return [...new Set(value)];
}
