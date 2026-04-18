import { haveBeenPaired } from './pairingAlgorithm';
import type { Pair, PairMember, PairingWeek } from '@/types';

export interface SwapWarning {
  member1: string;
  member2: string;
  weekNumber: number;
  date: string;
}

/** Returns all present members in a pair except the one with excludeId. */
function otherMembersIn(pair: Pair, excludeId: string): PairMember[] {
  return [pair.member1, pair.member2, pair.member3].filter(
    (m): m is PairMember => m != null && m.id !== excludeId
  );
}

/**
 * Given a proposed swap (fromMember ↔ toMember across two pairs),
 * returns a warning if the swap would create a repeat pairing from history,
 * or null if the swap is clean.
 *
 * Checks both directions:
 *   1. fromMember joining the target pair (alongside toMember's former partners)
 *   2. toMember joining the source pair (alongside fromMember's former partners)
 */
export function checkSwapWarning(
  sourcePair: Pair,
  fromMember: PairMember,
  targetPair: Pair,
  toMember: PairMember,
  history: PairingWeek[]
): SwapWarning | null {
  // Check 1: fromMember entering the target pair
  for (const other of otherMembersIn(targetPair, toMember.id)) {
    const check = haveBeenPaired(fromMember.id, other.id, history);
    if (check.paired && check.weekNumber && check.date) {
      return {
        member1: fromMember.name,
        member2: other.name,
        weekNumber: check.weekNumber,
        date: check.date,
      };
    }
  }

  // Check 2: toMember entering the source pair
  for (const other of otherMembersIn(sourcePair, fromMember.id)) {
    const check = haveBeenPaired(toMember.id, other.id, history);
    if (check.paired && check.weekNumber && check.date) {
      return {
        member1: toMember.name,
        member2: other.name,
        weekNumber: check.weekNumber,
        date: check.date,
      };
    }
  }

  return null;
}
