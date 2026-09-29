export type PlacePhoto = {
  url: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
};

type MediaPage = {
  title?: string;
  imageinfo?: {
    thumburl?: string;
    descriptionurl?: string;
    mime?: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
};

function plain(value: unknown) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
    .slice(0, 120);
}

function comparable(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function photoForTitle(title: string, pages: MediaPage[]): PlacePhoto | null {
  const wanted = comparable(title);
  if (wanted.length < 3) return null;
  const candidates = pages
    .filter((page) => comparable(page.title?.replace(/^File:/, '') ?? '').includes(wanted))
    .sort(
      (first, second) =>
        comparable(first.title ?? '').length - comparable(second.title ?? '').length,
    );
  for (const page of candidates) {
    const info = page.imageinfo?.[0];
    const metadata = info?.extmetadata;
    const license = plain(metadata?.LicenseShortName?.value);
    if (
      !info?.thumburl?.match(/^https:\/\/(thumb|upload)\.wikimedia\.org\//) ||
      !info.descriptionurl?.startsWith('https://commons.wikimedia.org/') ||
      !info.mime?.match(/^image\/(jpeg|png|webp)$/) ||
      !/^(CC BY(?:-SA)?(?: |$)|CC0|Public domain)/i.test(license)
    )
      continue;
    const licenseUrl = metadata?.LicenseUrl?.value;
    return {
      url: info.thumburl,
      sourceUrl: info.descriptionurl,
      author: plain(metadata?.Artist?.value) || 'Wikimedia Commons',
      license,
      licenseUrl:
        typeof licenseUrl === 'string' && licenseUrl.startsWith('https://')
          ? licenseUrl
          : info.descriptionurl,
    };
  }
  return null;
}

export function createPlacePhotoService(fetcher: typeof fetch = fetch) {
  const cache = new Map<string, { photo: PlacePhoto | null; expires: number }>();
  let queue: Promise<unknown> = Promise.resolve();
  let nextRequestAt = 0;
  let cooldownUntil = 0;

  async function search(title: string): Promise<PlacePhoto | null | undefined> {
    const parameters = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: title,
      gsrnamespace: '6',
      gsrlimit: '3',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '720',
      format: 'json',
      formatversion: '2',
    });
    try {
      const response = await fetcher(`https://commons.wikimedia.org/w/api.php?${parameters}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'WanderlyPrototype/0.1 (educational travel app)',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (response.status === 429) {
        const retrySeconds = Number(response.headers.get('retry-after'));
        cooldownUntil =
          Date.now() +
          Math.min(
            Number.isFinite(retrySeconds) && retrySeconds > 0 ? retrySeconds * 1000 : 60000,
            300000,
          );
        return undefined;
      }
      if (!response.ok) return undefined;
      const result = (await response.json()) as { query?: { pages?: MediaPage[] } };
      return photoForTitle(title, result.query?.pages ?? []);
    } catch {
      return undefined;
    }
  }

  return {
    lookup(title: string, countryCode: string): Promise<PlacePhoto | null> {
      const key = `${countryCode}:${comparable(title)}`;
      const cached = cache.get(key);
      if (cached && cached.expires > Date.now()) return Promise.resolve(cached.photo);
      const job = queue.then(async () => {
        const repeated = cache.get(key);
        if (repeated && repeated.expires > Date.now()) return repeated.photo;
        if (Date.now() < cooldownUntil) return null;
        const delay = nextRequestAt - Date.now();
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
        nextRequestAt = Date.now() + 1000;
        const photo = await search(title);
        if (photo !== undefined)
          cache.set(key, { photo, expires: Date.now() + 12 * 60 * 60 * 1000 });
        return photo ?? null;
      });
      queue = job.catch(() => null);
      return job;
    },
  };
}

export type PlacePhotoService = ReturnType<typeof createPlacePhotoService>;
