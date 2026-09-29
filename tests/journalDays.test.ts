import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  defaultJournalDay,
  journalTripDays,
} from '../src/screens/JournalScreen/JournalScreen.data';

test('tatil günlüğü gidiş ve dönüş dahil her güne sayfa açar', () => {
  const days = journalTripDays({
    destination: 'İtalya',
    dates: '29 Ara – 2 Oca',
    startDate: '2026-12-29',
    endDate: '2027-01-02',
  });
  assert.deepEqual(days, ['2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  assert.equal(defaultJournalDay(days, new Date('2026-12-31T12:00:00Z')), '2026-12-31');
  assert.equal(defaultJournalDay(days, new Date('2026-09-25T12:00:00Z')), '2026-12-29');
});

test('tarihleri bulunmayan eski geziler için boş gün listesi döner', () => {
  assert.deepEqual(journalTripDays({ destination: 'İtalya', dates: 'Tarih belirtilmedi' }), []);
});
