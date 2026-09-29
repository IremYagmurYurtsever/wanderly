import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveTripDates, tripTiming, validIsoDate } from '../src/models/tripDates';

test('takvim tarihleri geçerli günleri doğrular', () => {
  assert.equal(validIsoDate('2028-02-29'), true);
  assert.equal(validIsoDate('2026-02-29'), false);
  assert.equal(validIsoDate('2026-02-30'), false);
});

test('gidiş tarihi için geri sayım ve yolculuk durumu hesaplanır', () => {
  const now = new Date('2026-09-24T12:00:00Z');
  assert.deepEqual(tripTiming({ startDate: '2026-09-27', endDate: '2026-10-01' }, now), {
    status: 'upcoming',
    days: 3,
  });
  assert.deepEqual(tripTiming({ startDate: '2026-09-20', endDate: '2026-09-30' }, now), {
    status: 'ongoing',
    days: 6,
  });
  assert.deepEqual(tripTiming({ startDate: '2026-09-01', endDate: '2026-09-10' }, now), {
    status: 'past',
    days: 0,
  });
});

test('eski planların metin tarihinden kalan gün hesaplanır', () => {
  const now = new Date('2026-09-24T12:00:00Z');
  assert.deepEqual(resolveTripDates({ dates: '24 Eyl 2026 – 6 Eki 2026' }, now), {
    startDate: '2026-09-24',
    endDate: '2026-10-06',
  });
  assert.deepEqual(tripTiming({ dates: '27 Eyl 2026 – 1 Eki 2026' }, now), {
    status: 'upcoming',
    days: 3,
  });
  assert.deepEqual(tripTiming({ dates: '4 Kas – 11 Kas' }, now), {
    status: 'upcoming',
    days: 41,
  });
  assert.deepEqual(tripTiming({ dates: '24 Eyl 2026 – 6 Eki 2026' }, now), {
    status: 'ongoing',
    days: 12,
  });
});
