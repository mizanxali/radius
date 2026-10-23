import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localMatches, roomChanged } from './match.ts';
import type { Card, Profile } from './profile.ts';

const me = {
  id: 'me',
  name: 'Mizan',
  role: 'Founder',
  category: 'founder',
  bio: '',
  building: 'Radius',
  lookingFor: ['investors', 'designers'],
  offering: ['hiring', 'alpha'],
  socials: {},
  wallets: [],
} as Profile;
const card = (
  id: string,
  offering: Card['offering'],
  lookingFor: Card['lookingFor'],
): Card => ({
  id,
  name: id,
  role: '',
  category: 'builder',
  lookingFor,
  offering,
  verified: false,
});

test('local fallback ranks mutual fit and drops no-fit', () => {
  const ms = localMatches(me, [
    card('vc', ['investors'], ['alpha']), // gives me what I want, wants what I have
    card('designer', ['designers'], []),
    card('job', [], ['hiring']),
    card('nobody', ['grants'], ['cofounder']),
    { ...card('samecat', [], []), category: 'founder' },
  ]);
  assert.deepEqual(
    ms.map(m => m.id),
    ['vc', 'designer', 'job'],
  );
  assert.match(ms[0].reason, /Investors/);
});

test('room change threshold', () => {
  assert.equal(roomChanged([], ['a']), true);
  assert.equal(
    roomChanged(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c', 'd', 'e']),
    false,
  );
  assert.equal(
    roomChanged(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c', 'd', 'f']),
    false,
  ); // 20% exactly
  assert.equal(
    roomChanged(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c', 'x', 'y']),
    true,
  );
});
