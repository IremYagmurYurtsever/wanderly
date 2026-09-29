export type PlaceSummary = {
  text: string;
  sourceUrl: string;
};

type WikiPage = {
  title?: string;
  extract?: string;
  fullurl?: string;
};

function comparable(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchSummary(title: string, pages: WikiPage[]): PlaceSummary | null {
  const wanted = comparable(title);
  const page = pages.find((item) => comparable(item.title ?? '') === wanted);
  const text = page?.extract?.replace(/\s+/g, ' ').trim();
  if (!text || text.length < 30 || !page?.fullurl?.startsWith('https://tr.wikipedia.org/wiki/'))
    return null;
  return { text: text.slice(0, 480), sourceUrl: page.fullurl };
}

export function createPlaceSummaryService(fetcher: typeof fetch = fetch) {
  const cache = new Map<string, { summary: PlaceSummary | null; expires: number }>();
  let queue: Promise<unknown> = Promise.resolve();
  let nextRequestAt = 0;
  let cooldownUntil = 0;

  async function search(title: string): Promise<PlaceSummary | null | undefined> {
    const parameters = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: title,
      gsrnamespace: '0',
      gsrlimit: '3',
      prop: 'extracts|info',
      inprop: 'url',
      exintro: '1',
      explaintext: '1',
      exsentences: '2',
      format: 'json',
      formatversion: '2',
    });
    try {
      const response = await fetcher(`https://tr.wikipedia.org/w/api.php?${parameters}`, {
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
      const result = (await response.json()) as { query?: { pages?: WikiPage[] } };
      return matchSummary(title, result.query?.pages ?? []);
    } catch {
      return undefined;
    }
  }

  return {
    lookup(title: string, countryCode: string): Promise<PlaceSummary | null> {
      const key = `${countryCode}:${comparable(title)}`;
      const cached = cache.get(key);
      if (cached && cached.expires > Date.now()) return Promise.resolve(cached.summary);
      const job = queue.then(async () => {
        const repeated = cache.get(key);
        if (repeated && repeated.expires > Date.now()) return repeated.summary;
        if (Date.now() < cooldownUntil) return null;
        const delay = nextRequestAt - Date.now();
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
        nextRequestAt = Date.now() + 1000;
        const summary = await search(title);
        if (summary !== undefined)
          cache.set(key, { summary, expires: Date.now() + 12 * 60 * 60 * 1000 });
        return summary ?? null;
      });
      queue = job.catch(() => null);
      return job;
    },
  };
}

export type PlaceSummaryService = ReturnType<typeof createPlaceSummaryService>;
