/**
 * C3 Cafe Pairing Algorithm
 *
 * Generates intelligent coffee chat pairings that:
 * 1. Honor pre-assigned requests (locked pairs from the social chair's queue)
 * 2. Avoid repeat pairings from this year's history (heavy penalty)
 * 3. Prioritize cross-cohort connections (diversity bonus)
 * 4. Handle odd numbers with a group of 3
 * 5. Use Fisher-Yates shuffle for fair randomization
 */

import type { Member, Pair, PairingWeek, Request } from '@/types';

// ── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Lower score = better match.
 * Repeat pairings within the year get a heavy penalty.
 * Cross-cohort pairings get a bonus.
 */
function score(a: Member, b: Member, history: PairingWeek[]): number {
  let s = 0;

  const beenTogether = history.some(week =>
    week.pairs.some(pair => {
      const ids = [pair.member1.id, pair.member2?.id, pair.member3?.id].filter(Boolean);
      return ids.includes(a.id) && ids.includes(b.id);
    })
  );

  if (beenTogether) s += 1000;
  if (a.cohort_id && b.cohort_id && a.cohort_id !== b.cohort_id) s -= 100;

  return s;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Check if two members have been paired together this year. */
export function haveBeenPaired(
  memberId1: string,
  memberId2: string,
  history: PairingWeek[]
): { paired: boolean; weekNumber?: number; date?: string } {
  for (const week of history) {
    for (const pair of week.pairs) {
      const ids = [pair.member1.id, pair.member2?.id, pair.member3?.id].filter(Boolean);
      if (ids.includes(memberId1) && ids.includes(memberId2)) {
        return { paired: true, weekNumber: week.week_number, date: week.date };
      }
    }
  }
  return { paired: false };
}

// ── Main algorithm ────────────────────────────────────────────────────────────

interface AlgorithmInput {
  /** All active members for this year */
  activeMembers: Member[];
  /** Pre-assigned pairs from the requests queue */
  requests: Request[];
  /** This year's pairing history (used for repeat detection) */
  history: PairingWeek[];
}

interface AlgorithmResult {
  pairs: Omit<Pair, 'id' | 'week_id'>[];
}

export function generatePairings({ activeMembers, requests, history }: AlgorithmInput): AlgorithmResult {
  const pairs: Omit<Pair, 'id' | 'week_id'>[] = [];

  // Track which member IDs have been assigned
  const assigned = new Set<string>();

  // ── Step 1: Lock in pre-assigned request pairs ────────────────────────────
  for (const req of requests) {
    // Skip if either member is not in the active pool or already assigned
    const m1 = activeMembers.find(m => m.id === req.member1_id);
    const m2 = activeMembers.find(m => m.id === req.member2_id);
    if (!m1 || !m2) continue;
    if (assigned.has(m1.id) || assigned.has(m2.id)) continue;

    pairs.push({
      member1: { id: m1.id, name: m1.name, cohort_name: m1.cohort_name ?? '' },
      member2: { id: m2.id, name: m2.name, cohort_name: m2.cohort_name ?? '' },
      is_manual: true,
    });
    assigned.add(m1.id);
    assigned.add(m2.id);
  }

  // ── Step 2: Collect remaining unassigned active members ───────────────────
  const pool = shuffle(activeMembers.filter(m => !assigned.has(m.id)));

  // ── Step 3: Handle odd number — find best group of 3 ─────────────────────
  if (pool.length % 2 === 1 && pool.length >= 3) {
    let bestScore = Infinity;
    let bestTrio: [Member, Member, Member] | null = null;

    for (let i = 0; i < pool.length - 2; i++) {
      for (let j = i + 1; j < pool.length - 1; j++) {
        for (let k = j + 1; k < pool.length; k++) {
          const s =
            score(pool[i], pool[j], history) +
            score(pool[i], pool[k], history) +
            score(pool[j], pool[k], history);
          if (s < bestScore) {
            bestScore = s;
            bestTrio = [pool[i], pool[j], pool[k]];
          }
        }
      }
    }

    if (bestTrio) {
      const [a, b, c] = bestTrio;
      pairs.push({
        member1: { id: a.id, name: a.name, cohort_name: a.cohort_name ?? '' },
        member2: { id: b.id, name: b.name, cohort_name: b.cohort_name ?? '' },
        member3: { id: c.id, name: c.name, cohort_name: c.cohort_name ?? '' },
        is_manual: false,
      });
      [a.id, b.id, c.id].forEach(id => {
        const idx = pool.findIndex(m => m.id === id);
        if (idx > -1) pool.splice(idx, 1);
      });
    }
  }

  // ── Step 4: Greedily pair remaining members ───────────────────────────────
  while (pool.length >= 2) {
    const current = pool.shift()!;
    let bestScore = Infinity;
    let bestIdx = -1;

    for (let i = 0; i < pool.length; i++) {
      const s = score(current, pool[i], history);
      if (s < bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) break;
    const partner = pool.splice(bestIdx, 1)[0];

    pairs.push({
      member1: { id: current.id, name: current.name, cohort_name: current.cohort_name ?? '' },
      member2: { id: partner.id, name: partner.name, cohort_name: partner.cohort_name ?? '' },
      is_manual: false,
    });
  }

  return { pairs };
}
