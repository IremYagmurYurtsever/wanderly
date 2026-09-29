import assert from 'node:assert/strict';
import { test } from 'node:test';
import { googleMapsPlaceUrl, googleMapsSearchUrl } from '../src/screens/ExploreScreen/mapLinks';

test('yerel kartların konumu Google Maps aramasına dönüştürülür', () => {
  assert.equal(
    googleMapsSearchUrl('Palazzo Doria Pamphilj, Via del Corso, Roma'),
    'https://www.google.com/maps/search/?api=1&query=Palazzo%20Doria%20Pamphilj%2C%20Via%20del%20Corso%2C%20Roma',
  );
});

test('Google mekân bağlantısı korunur; farklı adres güvenli aramaya döner', () => {
  const exact = 'https://maps.google.com/?cid=123';
  assert.equal(googleMapsPlaceUrl(exact, 'Roma'), exact);
  assert.equal(
    googleMapsPlaceUrl('https://example.com/map', 'Roma'),
    'https://www.google.com/maps/search/?api=1&query=Roma',
  );
});
