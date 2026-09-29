export function decodePlaceRatings(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, rating]) =>
        key.length <= 512 && Number.isInteger(rating) && Number(rating) >= 1 && Number(rating) <= 5,
    ),
  );
}
