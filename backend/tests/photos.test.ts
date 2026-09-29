import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPlacePhotoService } from '../src/places/photos.js';

test('mekân adıyla eşleşen açık lisanslı fotoğrafı bulur ve önbelleğe alır', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return new Response(
      JSON.stringify({
        query: {
          pages: [
            {
              title: 'File:Palazzo Doria Pamphilj.jpg',
              imageinfo: [
                {
                  thumburl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/example.jpg',
                  descriptionurl:
                    'https://commons.wikimedia.org/wiki/File:Palazzo_Doria_Pamphilj.jpg',
                  mime: 'image/jpeg',
                  extmetadata: {
                    LicenseShortName: { value: 'CC BY 4.0' },
                    LicenseUrl: { value: 'https://creativecommons.org/licenses/by/4.0/' },
                    Artist: { value: '<a>Fotoğrafçı</a>' },
                  },
                },
              ],
            },
          ],
        },
      }),
      { status: 200 },
    );
  };
  const photos = createPlacePhotoService(fetcher as typeof fetch);
  const first = await photos.lookup('Palazzo Doria Pamphilj', 'IT');
  const second = await photos.lookup('Palazzo Doria Pamphilj', 'IT');
  assert.equal(first?.author, 'Fotoğrafçı');
  assert.equal(first?.license, 'CC BY 4.0');
  assert.deepEqual(second, first);
  assert.equal(calls, 1);
});

test('adı eşleşmeyen veya açık lisansı olmayan görseli kullanmaz', async () => {
  const photos = createPlacePhotoService(
    (async () =>
      new Response(
        JSON.stringify({
          query: {
            pages: [
              {
                title: 'File:Başka bir saray.jpg',
                imageinfo: [{ thumburl: 'https://thumb.wikimedia.org/test.jpg' }],
              },
            ],
          },
        }),
        { status: 200 },
      )) as typeof fetch,
  );
  assert.equal(await photos.lookup('Palazzo Doria Pamphilj', 'IT'), null);
});
