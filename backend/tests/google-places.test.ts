import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGooglePlacesService } from '../src/places/google.js';
import { getCountry } from '../src/places/countries.js';

test('Google Demo Key araması yalnızca desteklenen alanları ister ve sonuçları dönüştürür', async () => {
  let url = '';
  let options: RequestInit | undefined;
  const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
    url = String(input);
    options = init;
    return new Response(
      JSON.stringify({
        places: [
          {
            id: 'ChIJ123',
            displayName: { text: 'Roma Müzesi' },
            formattedAddress: 'Roma, İtalya',
            addressComponents: [{ types: ['country'], shortText: 'IT' }],
            primaryType: 'museum',
            googleMapsUri: 'https://maps.google.com/example',
            attributions: [{ provider: 'Kaynak', providerUri: 'https://example.com' }],
          },
          {
            id: 'ChIJ456',
            displayName: { text: 'Başka Ülke Müzesi' },
            formattedAddress: 'Paris, Fransa',
            addressComponents: [{ types: ['country'], shortText: 'FR' }],
          },
        ],
      }),
      { status: 200 },
    );
  };
  const service = createGooglePlacesService('demo-key', fetcher as typeof fetch);
  const places = await service.search(getCountry('IT')!, 'museums', '');
  assert.equal(url, 'https://places.googleapis.com/v1/places:searchText');
  assert.equal(options?.method, 'POST');
  assert.equal((options?.headers as Record<string, string>)['X-Goog-Api-Key'], 'demo-key');
  assert.doesNotMatch(
    (options?.headers as Record<string, string>)['X-Goog-FieldMask'],
    /photos|reviews|rating/,
  );
  assert.equal(JSON.parse(String(options?.body)).textQuery, 'museums in Italy');
  assert.equal(JSON.parse(String(options?.body)).regionCode, 'IT');
  assert.equal(places[0]?.title, 'Roma Müzesi');
  assert.equal(places.length, 1);
  assert.equal(places[0]?.mapsUrl, 'https://maps.google.com/example');
});

test('anahtar yoksa Google isteği gönderilmez', async () => {
  const service = createGooglePlacesService('', (() => {
    throw new Error('İstek gönderilmemeli');
  }) as typeof fetch);
  await assert.rejects(service.search(getCountry('TR')!, 'all', ''), {
    code: 'GOOGLE_KEY_MISSING',
  });
});

test('konaklama araması otelleri ülke ve harita bilgisiyle döndürür', async () => {
  let body: Record<string, unknown> = {};
  const fetcher = async (_input: string | URL | Request, options?: RequestInit) => {
    body = JSON.parse(String(options?.body));
    return new Response(
      JSON.stringify({
        places: [
          {
            id: 'hotel-1',
            displayName: { text: 'Örnek Otel' },
            formattedAddress: 'Roma, İtalya',
            addressComponents: [{ types: ['country'], shortText: 'IT' }],
            primaryType: 'hotel',
            googleMapsUri: 'https://maps.google.com/hotel-1',
          },
        ],
      }),
      { status: 200 },
    );
  };
  const places = await createGooglePlacesService('demo-key', fetcher as typeof fetch).search(
    getCountry('IT')!,
    'hotels',
    '',
  );
  assert.equal(body.textQuery, 'hotels in Italy');
  assert.equal(places[0]?.title, 'Örnek Otel');
  assert.equal(places[0]?.type, 'hotel');
  assert.equal(places[0]?.mapsUrl, 'https://maps.google.com/hotel-1');
});

test('serbest mekân araması ülke kısıtlamaz ve gerçek yerleri döndürür', async () => {
  let body: Record<string, unknown> = {};
  const fetcher = async (_input: string | URL | Request, options?: RequestInit) => {
    body = JSON.parse(String(options?.body));
    return new Response(
      JSON.stringify({
        places: [
          {
            id: 'restaurant-1',
            displayName: { text: 'Deniz Restoran' },
            formattedAddress: 'İstanbul, Türkiye',
            addressComponents: [{ types: ['country'], shortText: 'TR' }],
            primaryType: 'restaurant',
          },
          {
            id: 'museum-1',
            displayName: { text: 'Roma Müzesi' },
            formattedAddress: 'Roma, İtalya',
            addressComponents: [{ types: ['country'], shortText: 'IT' }],
            primaryType: 'museum',
          },
        ],
      }),
      { status: 200 },
    );
  };
  const items = await createGooglePlacesService('demo-key', fetcher as typeof fetch).searchAny(
    'restoran ve müze',
  );
  assert.equal(body.textQuery, 'restoran ve müze');
  assert.equal(body.regionCode, undefined);
  assert.deepEqual(
    items.map((item) => item.countryCode),
    ['TR', 'IT'],
  );
});

test('geçersiz Google anahtarı ayrı hata olarak bildirilir', async () => {
  const fetcher = async () =>
    new Response(
      JSON.stringify({ error: { message: 'API key not valid. Please pass a valid API key.' } }),
      {
        status: 400,
      },
    );
  const service = createGooglePlacesService('invalid-key', fetcher as typeof fetch);
  await assert.rejects(service.search(getCountry('IT')!, 'all', ''), {
    code: 'GOOGLE_KEY_INVALID',
  });
});
