export class ApiError extends Error {
  constructor(
    public code: string,
    public status = 0,
  ) {
    super(code);
  }
}

export function resolveApiUrl(
  configured: string | undefined,
  host: string | undefined,
  development: boolean,
) {
  const custom = configured?.trim();
  if (!custom && (!development || !host)) throw new ApiError('API_CONFIG');
  let url: URL;
  try {
    const source = custom || `http://${new URL(`http://${host}`).hostname}:3000`;
    url = new URL(source);
  } catch {
    throw new ApiError('API_CONFIG');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new ApiError('API_CONFIG');
  if (!development && url.protocol !== 'https:') throw new ApiError('API_CONFIG');
  return url.origin;
}

export function createApiClient(
  baseUrl: () => string,
  fetcher: typeof fetch = fetch,
  timeout = 12000,
) {
  return {
    async request(
      path: string,
      body?: unknown,
      token?: string,
      method?: string,
    ): Promise<Record<string, unknown>> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetcher(baseUrl() + path, {
          method: method ?? (body === undefined ? 'GET' : 'POST'),
          headers: {
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
          credentials: 'omit',
        });
        if (response.status === 204) return {};
        let data: Record<string, unknown>;
        try {
          data = await response.json();
        } catch {
          throw new ApiError('INVALID_RESPONSE', response.status);
        }
        if (!data || typeof data !== 'object' || Array.isArray(data))
          throw new ApiError('INVALID_RESPONSE', response.status);
        if (!response.ok)
          throw new ApiError(
            typeof data.code === 'string' ? data.code : 'SERVER_ERROR',
            response.status,
          );
        return data;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;
