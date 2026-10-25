import { useSyncExternalStore } from 'react';
import { WORKER_URL } from './config';
import { storage } from './mesh';
import { cachedProfile, getMyProfile, publishCard, type Peer } from './peers';
import { localMatches, roomChanged, toPerson, type Match } from './match';
import type { Card, Profile } from './profile';

type State = {
  matches: Match[];
  loading: boolean;
  room: string[];
  summarizing?: 'reading' | 'failed'; // my website summary
  writing: Record<string, 'writing' | 'failed'>; // icebreakers by peer id
};
let state: State = { matches: [], loading: false, room: [], writing: {} };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach(l => l());
};

export const useMatches = () =>
  useSyncExternalStore(
    l => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  );

const meAsPerson = (me: Profile) =>
  toPerson(
    {
      id: me.id,
      name: me.name,
      role: me.role,
      category: me.category,
      lookingFor: me.lookingFor,
      offering: me.offering,
      verified: false,
    },
    me,
  );

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${WORKER_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

/** Ranks the room with Claude; falls back to local tag matching when offline. */
export async function refreshMatches(peers: Peer[], force = false) {
  const me = getMyProfile();
  // A peer's full profile (bio, building) landing counts as a change: re-rank with it.
  const ids = peers
    .map(p => p.card.id + (cachedProfile(p.card.id) ? '+' : ''))
    .sort();
  if (
    !me ||
    state.loading ||
    !ids.length ||
    (!force && !roomChanged(state.room, ids))
  )
    return;
  set({ loading: true, room: ids });
  const cards = peers.map(p => p.card);
  try {
    const { matches } = await post<{ matches: Omit<Match, 'ai'>[] }>('/match', {
      me: meAsPerson(me),
      others: cards.map(c => toPerson(c, cachedProfile(c.id))),
    });
    set({ matches: matches.map(m => ({ ...m, ai: true })) });
  } catch (err) {
    console.warn('AI match unavailable, using local fit', err);
    set({ matches: localMatches(me, cards) });
  } finally {
    set({ loading: false });
  }
}

/**
 * Has Claude read my website and keeps what my project does on my profile.
 * No-op when the summary already describes the current website.
 */
export async function summarizeMyWebsite() {
  const url = getMyProfile()?.website;
  if (!url || getMyProfile()?.summary?.url === url) return;
  if (state.summarizing === 'reading') return;
  set({ summarizing: 'reading' });
  let ok = false;
  try {
    const { summary } = await post<{ summary: string | null }>('/summarize', {
      url,
    });
    const me = getMyProfile();
    if (summary && me?.website === url) {
      storage.set(
        'profile',
        JSON.stringify({ ...me, summary: { text: summary, url } }),
      );
      await publishCard(); // new summary hash: peers refetch my profile
    }
    ok = !!summary;
  } catch (err) {
    console.warn('website summary unavailable', err);
  }
  set({ summarizing: ok ? undefined : 'failed' });
  // The website was edited while Claude was reading the old one.
  if (getMyProfile()?.website !== url) void summarizeMyWebsite();
}

// Icebreakers are written one at a time, only when asked, and kept so a reload doesn't pay again.
const iceKey = (id: string) => `icebreaker:${id}`;
export const savedIcebreaker = (id: string) => storage.getString(iceKey(id));

export async function writeIcebreaker(card: Card, reason?: string) {
  const me = getMyProfile();
  if (!me || state.writing[card.id] === 'writing') return;
  set({ writing: { ...state.writing, [card.id]: 'writing' } });
  let failed = false;
  try {
    const { icebreaker } = await post<{ icebreaker: string }>('/icebreaker', {
      me: meAsPerson(me),
      them: toPerson(card, cachedProfile(card.id)),
      reason,
    });
    storage.set(iceKey(card.id), icebreaker);
  } catch (err) {
    console.warn('icebreaker unavailable', err);
    failed = true;
  }
  const writing = { ...state.writing };
  if (failed) writing[card.id] = 'failed';
  else delete writing[card.id];
  set({ writing });
}
