// Pure matching helpers (no React Native imports, so node can test them).
import { TAGS, type Card, type Profile, type Tag } from './profile.ts';

export type Match = {
  id: string;
  score: number;
  reason: string;
  icebreaker: string;
  ai: boolean;
};

/** What the Worker gets per person: the public bits only, no avatar or wallet proofs. */
export const toPerson = (c: Card, p?: Profile) => ({
  id: c.id,
  name: p?.name ?? c.name,
  role: p?.role ?? c.role,
  company: p?.company ?? c.company,
  category: p?.category ?? c.category,
  building: p?.building?.slice(0, 400),
  bio: p?.bio?.slice(0, 400),
  lookingFor: p?.lookingFor ?? c.lookingFor,
  offering: p?.offering ?? c.offering,
  tier: c.tier,
});

const overlap = (a: Tag[], b: Tag[]) => a.filter(t => b.includes(t));

/**
 * Offline fallback when the Worker is unreachable: mutual tag fit.
 * What they offer that I want counts double what I offer that they want.
 */
export function localMatches(me: Profile, others: Card[]): Match[] {
  return others
    .map(o => {
      const theyGive = overlap(me.lookingFor, o.offering);
      const iGive = overlap(o.lookingFor, me.offering);
      const score = Math.min(
        100,
        theyGive.length * 30 +
          iGive.length * 15 +
          (o.category === me.category ? 5 : 0),
      );
      const reason = theyGive.length
        ? `Offers ${theyGive.map(t => TAGS[t]).join(' + ')}, which you're after`
        : `Looking for ${iGive.map(t => TAGS[t]).join(' + ')}, which you offer`;
      const opener = o.company
        ? `What are you working on at ${o.company} right now?`
        : `What brought you to this event?`;
      return { id: o.id, score, reason, icebreaker: opener, ai: false };
    })
    .filter(m => m.score >= 15) // at least one real tag fit; category alone isn't a reason
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/** Room "fingerprint": re-ask the AI only when enough of the room changed. */
export function roomChanged(prev: string[], next: string[]) {
  if (!prev.length) return next.length > 0;
  const kept = next.filter(id => prev.includes(id)).length;
  return 1 - kept / Math.max(prev.length, next.length) > 0.2;
}
