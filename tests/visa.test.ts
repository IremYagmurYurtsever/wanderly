import assert from 'node:assert/strict';
import { test } from 'node:test';
import { profileInitials } from '../src/models/profile';
import { decodeVisas, visaExpiry } from '../src/models/visa';

test('ad ve soyad baş harfleri profilde görünür', () => {
  assert.equal(profileInitials('Ayşe Yılmaz'), 'AY');
  assert.equal(profileInitials('İrem Yağmur Yurtsever'), 'İY');
  assert.equal(profileInitials('Merve'), 'M');
});

test('vize bitişi ve geri sayımı takvim günlerine göre hesaplanır', () => {
  const visa = { countryCode: 'IT', validFrom: '2026-09-25', durationDays: 90 };
  assert.deepEqual(visaExpiry(visa, '2026-09-25'), {
    expiresOn: '2026-12-23',
    daysLeft: 89,
    expired: false,
  });
  assert.equal(visaExpiry(visa, '2026-12-24').expired, true);
  assert.throws(() =>
    decodeVisas([{ id: 'one', countryCode: 'IT', validFrom: '2026-02-30', durationDays: 90 }]),
  );
});
