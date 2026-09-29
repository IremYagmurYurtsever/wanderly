import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createJsonStore } from '../src/storage/jsonStore';
import { appendTrip, decodeHome, defaultHome, removeTrip, replaceTrip } from '../src/models/trip';
import { savedCount, matchesCollection } from '../src/screens/ExploreScreen/exploreSelectors';
import { createTabHandler, previousScreen } from '../src/navigation/routes';
import { decodeHomeSearch, emptyHomeSearch, withSearchResults } from '../src/models/homeSearch';
import { decodePlaceRatings } from '../src/models/placeRatings';

function fixture() {
  const data = new Map<string, string>();
  const store = createJsonStore({
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
  });
  return { data, store };
}

test('legacy trip survives migration and subsequent plans', () => {
  const { trips: _trips, ...old } = defaultHome;
  const migrated = decodeHome({
    ...old,
    trip: { destination: 'Ankara', dates: 'Eylül', custom: true },
  });
  const next = appendTrip(migrated, { destination: ' İzmir ', dates: ' Ekim ' }, 'new');
  assert.deepEqual(
    next.trips.map((trip) => trip.destination),
    ['Ankara', 'İzmir'],
  );
  assert.equal(decodeHome(next).trips.length, 2);
});

test('concurrent plans and preferences preserve all data on reload', async () => {
  const { store } = fixture();
  await Promise.all([
    store.update('home', defaultHome, decodeHome, (data) =>
      appendTrip(data, { destination: 'Roma', dates: 'Ekim' }, 'first'),
    ),
    store.update('home', defaultHome, decodeHome, (data) => ({ ...data, amount: '50' })),
    store.update('home', defaultHome, decodeHome, (data) =>
      appendTrip(data, { destination: 'Paris', dates: 'Kasım' }, 'second'),
    ),
  ]);
  const loaded = await store.get('home', defaultHome, decodeHome);
  assert.equal(loaded.trips.length, 2);
  assert.equal(loaded.amount, '50');
});

test('corrupt data is never overwritten', async () => {
  const { store, data } = fixture();
  data.set('home', '{broken');
  await assert.rejects(store.update('home', defaultHome, decodeHome, (value) => value));
  assert.equal(data.get('home'), '{broken');
});

test('queue recovers after failed writes', async () => {
  let fail = true;
  let raw: string | null = null;
  const store = createJsonStore({
    getItem: async () => raw,
    setItem: async (_key, value) => {
      if (fail) {
        fail = false;
        throw new Error('disk');
      }
      raw = value;
    },
  });
  await assert.rejects(store.set('key', 1));
  await store.set('key', 2);
  assert.equal(raw, '2');
});

test('empty destinations and duplicate IDs are rejected', () => {
  assert.throws(() => appendTrip(defaultHome, { destination: ' ', dates: 'Ekim' }, 'id'));
  const data = appendTrip(defaultHome, { destination: 'Roma', dates: 'Ekim' }, 'id');
  assert.throws(() => appendTrip(data, data.trip, 'id'));
});

test('editing and deleting trips keeps the newest saved trip in sync', () => {
  const first = appendTrip(defaultHome, { destination: 'Roma', dates: 'Ekim' }, 'first');
  const second = appendTrip(first, { destination: 'Paris', dates: 'Kasım' }, 'second');
  const edited = replaceTrip(second, 'second', { destination: ' Lizbon ', dates: ' Aralık ' });
  assert.equal(edited.trip.destination, 'Lizbon');
  assert.equal(edited.trips[1].dates, 'Aralık');
  const removed = removeTrip(edited, 'second');
  assert.equal(removed.trip.destination, 'Roma');
  assert.equal(removeTrip(removed, 'first').trips.length, 0);
  assert.throws(() => replaceTrip(removed, 'missing', { destination: 'X', dates: 'Y' }));
  assert.throws(() => removeTrip(removed, 'missing'));
});

test('saved count includes collections and search filters them', () => {
  assert.equal(savedCount(['rome-collection', 'place', 'place', 'missing'], ['place']), 2);
  assert.equal(matchesCollection(['rome-collection'], 'Kaydedilenler', 'ROMA'), true);
  assert.equal(matchesCollection(['rome-collection'], 'Kaydedilenler', 'Paris'), false);
});

test('tabs navigate while reselect scrolls', () => {
  let target = '';
  let scrolled = false;
  const select = createTabHandler(
    'Ana Sayfa',
    (screen) => {
      target = screen;
    },
    () => {
      scrolled = true;
    },
  );
  select('Keşfet');
  assert.equal(target, 'explore');
  select('Ana Sayfa');
  assert.equal(scrolled, true);
  assert.equal(previousScreen('signup'), 'signin');
  assert.equal(previousScreen('forgot-password'), 'signin');
  assert.equal(previousScreen('profile'), 'home');
  assert.equal(previousScreen('home'), null);
});

test('home search remembers recent terms and the latest result for this account', async () => {
  const { store } = fixture();
  const place = {
    id: 'place-1',
    title: 'Roma Restoran',
    address: 'Roma, İtalya',
    type: 'restaurant',
    countryCode: 'IT',
    mapsUrl: 'https://maps.google.com/example',
    attributions: [],
  };
  await store.update('search', emptyHomeSearch, decodeHomeSearch, (current) =>
    withSearchResults(current, ' Roma restoran ', [place]),
  );
  await store.update('search', emptyHomeSearch, decodeHomeSearch, (current) =>
    withSearchResults(current, 'ROMA RESTORAN', [place]),
  );
  const loaded = await store.get('search', emptyHomeSearch, decodeHomeSearch);
  assert.deepEqual(loaded.queries, ['ROMA RESTORAN']);
  assert.equal(loaded.results[0].title, 'Roma Restoran');
  assert.throws(() => decodeHomeSearch({ queries: [], lastQuery: '', results: [{ id: 1 }] }));
  assert.equal(withSearchResults(emptyHomeSearch, 'e', [place]).lastQuery, 'e');
});

test('mekân puanları yalnızca geçerli yıldızları okur', () => {
  assert.deepEqual(decodePlaceRatings({ roma: 4, paris: 0, london: 6, naples: '5' }), {
    roma: 4,
  });
});
