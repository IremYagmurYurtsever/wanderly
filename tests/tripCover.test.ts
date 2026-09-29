import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tripCountryCode, tripCoverSearch } from '../src/models/tripCover';

test('ülke kodu eksik eski planın fotoğraf aramasını çıkarır', () => {
  assert.equal(tripCountryCode({ destination: 'İsviçre Alpleri' }), 'CH');
  assert.deepEqual(tripCoverSearch({ destination: 'İtalya' }), {
    countryCode: 'IT',
    title: 'Colosseum',
    fallbackTitle: 'Colosseum',
  });
  assert.equal(tripCoverSearch({ destination: 'Bilinmeyen rota' }), null);
});

test('eklenen gezi durağının fotoğrafına öncelik verir', () => {
  assert.deepEqual(
    tripCoverSearch({
      destination: 'Fransa',
      countryCode: 'FR',
      stops: [{ kind: 'place', placeId: 'a', title: 'Louvre Museum', address: '', mapsUrl: '' }],
    }),
    { countryCode: 'FR', title: 'Louvre Museum', fallbackTitle: 'Eiffel Tower' },
  );
});
