export const collectionId = 'rome-collection';
export const collectionTitle = 'Roma: Ebedî Şehirde altın saatler';

export function savedCount(saved: string[], placeIds: string[]) {
  const available = new Set([...placeIds, collectionId]);
  return [...new Set(saved)].filter((id) => available.has(id)).length;
}

export function matchesCollection(saved: string[], category: string, query: string) {
  return (
    category === 'Kaydedilenler' &&
    saved.includes(collectionId) &&
    collectionTitle.toLocaleLowerCase('tr-TR').includes(query.trim().toLocaleLowerCase('tr-TR'))
  );
}
