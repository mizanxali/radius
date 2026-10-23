import { useSyncExternalStore } from 'react';
import { WORKER_URL } from './config';
import { cachedProfile, getMyProfile, type Peer } from './peers';
import { localMatches, roomChanged, toPerson, type Match } from './match';
import type { Profile } from './profile';

type State = { matches: Match[]; loading: boolean; room: string[] };
let state: State = { matches: [], loading: false, room: [] };
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
