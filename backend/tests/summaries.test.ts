import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPlaceSummaryService } from '../src/places/summaries.js';

test('tam başlık eşleşen Türkçe Vikipedi özetini bulur ve önbelleğe alır', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return new Response(
      JSON.stringify({
        query: {
          pages: [
            {
              title: 'Başka Müze',
              extract: 'Bu başka bir müzedir.',
              fullurl: 'https://tr.wikipedia.org/wiki/Başka_Müze',
            },
            {
              title: 'İstanbul Arkeoloji Müzeleri',
              extract:
                'İstanbul Arkeoloji Müzeleri çok sayıda tarihî eseri barındıran önemli bir müzeler topluluğudur.',
              fullurl: 'https://tr.wikipedia.org/wiki/İstanbul_Arkeoloji_Müzeleri',
            },
          ],
        },
      }),
      { status: 200 },
    );
  };
  const summaries = createPlaceSummaryService(fetcher as typeof fetch);
  const first = await summaries.lookup('İstanbul Arkeoloji Müzeleri', 'TR');
  const second = await summaries.lookup('İstanbul Arkeoloji Müzeleri', 'TR');
  assert.match(first?.text ?? '', /tarihî eseri/);
  assert.equal(first?.sourceUrl, 'https://tr.wikipedia.org/wiki/İstanbul_Arkeoloji_Müzeleri');
  assert.deepEqual(second, first);
  assert.equal(calls, 1);
});

test('farklı Wikipedia sayfasının açıklamasını mekâna bağlamaz', async () => {
  const summaries = createPlaceSummaryService(
    (async () =>
      new Response(
        JSON.stringify({
          query: {
            pages: [
              {
                title: 'Palazzo Barberini',
                extract: 'Roma kentindeki başka bir saray hakkında uzun bir açıklama.',
                fullurl: 'https://tr.wikipedia.org/wiki/Palazzo_Barberini',
              },
            ],
          },
        }),
        { status: 200 },
      )) as typeof fetch,
  );
  assert.equal(await summaries.lookup('Palazzo Doria Pamphilj', 'IT'), null);
});
