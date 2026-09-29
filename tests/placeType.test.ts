import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isLodgingType, placeTypeLabel } from '../src/models/placeType';

test('Google konaklama türleri otel olarak Türkçe gösterilir', () => {
  for (const type of ['hotel', 'lodging', 'resort_hotel', 'guest_house', 'hostel']) {
    assert.equal(isLodgingType(type), true);
    assert.equal(placeTypeLabel(type), 'Otel · Konaklama');
  }
  assert.equal(isLodgingType('museum'), false);
  assert.equal(placeTypeLabel('art_museum'), 'art museum');
});
