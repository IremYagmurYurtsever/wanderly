export function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

export function googleMapsPlaceUrl(url: string | undefined, query: string) {
  if (url) {
    try {
      const parsed = new URL(url);
      if (
        parsed.protocol === 'https:' &&
        (parsed.hostname === 'maps.google.com' ||
          (parsed.hostname === 'www.google.com' && parsed.pathname.startsWith('/maps')))
      )
        return url;
    } catch {
      return googleMapsSearchUrl(query);
    }
  }
  return googleMapsSearchUrl(query);
}
