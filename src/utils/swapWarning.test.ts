import { describe, it, expect } from 'vitest';
import { haveBeenPaired } from './pairingAlgorithm';
import { checkSwapWarning } from './swapWarning';
import type { Pair, PairingWeek } from '@/types';

// ── Test helpers ──────────────────────────────────────────────────────────────

function member(id: string, name: string) {
  return { id, name, cohort_name: '' };
}

function pair(id: string, m1: ReturnType<typeof member>, m2?: ReturnType<typeof member>, m3?: ReturnType<typeof member>): Pair {
  return { id, week_id: 'w1', member1: m1, member2: m2, member3: m3, is_manual: false };
}

function weekWithPair(weekNumber: number, ...pairArgs: Parameters<typeof pair>): PairingWeek {
  return {
    id: `week-${weekNumber}`,
    year_id: 'y1',
    week_number: weekNumber,
    date: `2025-01-${String(weekNumber).padStart(2, '0')}`,
    pairs: [pair(...pairArgs)],
  };
}

// ── haveBeenPaired ────────────────────────────────────────────────────────────

describe('haveBeenPaired', () => {
  it('returns false when history is empty', () => {
    const result = haveBeenPaired('a', 'b', []);
    expect(result.paired).toBe(false);
  });

  it('returns false when they have not been paired', () => {
    const alice = member('a', 'Alice');
    const carol = member('c', 'Carol');
    const history = [weekWithPair(1, 'p1', alice, carol)];
    expect(haveBeenPaired('a', 'b', history).paired).toBe(false);
  });

  it('returns true with week info when they have been paired', () => {
    const alice = member('a', 'Alice');
    const bob = member('b', 'Bob');
    const history = [weekWithPair(3, 'p1', alice, bob)];
    const result = haveBeenPaired('a', 'b', history);
    expect(result.paired).toBe(true);
    expect(result.weekNumber).toBe(3);
  });

  it('detects pairing regardless of argument order', () => {
    const alice = member('a', 'Alice');
    const bob = member('b', 'Bob');
    const history = [weekWithPair(1, 'p1', alice, bob)];
    expect(haveBeenPaired('b', 'a', history).paired).toBe(true);
  });

  it('detects pairing inside a trio', () => {
    const alice = member('a', 'Alice');
    const bob = member('b', 'Bob');
    const carol = member('c', 'Carol');
    const history = [weekWithPair(1, 'p1', alice, bob, carol)];
    expect(haveBeenPaired('a', 'c', history).paired).toBe(true);
    expect(haveBeenPaired('b', 'c', history).paired).toBe(true);
  });
});

// ── checkSwapWarning ──────────────────────────────────────────────────────────

describe('checkSwapWarning', () => {
  it('returns null when neither direction has history', () => {
    const alice = member('a', 'Alice');
    const bob = member('b', 'Bob');
    const carol = member('c', 'Carol');
    const dan = member('d', 'Dan');

    const sourcePair = pair('p1', alice, bob);
    const targetPair = pair('p2', carol, dan);

    // Swapping Alice (from p1) with Carol (from p2) — no shared history
    const result = checkSwapWarning(sourcePair, alice, targetPair, carol, []);
    expect(result).toBeNull();
  });

  it('warns when fromMember has history with a remaining target-pair member', () => {
    const alice = member('a', 'Alice');
    const bob = member('b', 'Bob');
    const carol = member('c', 'Carol');
    const dan = member('d', 'Dan');

    // Alice and Dan were paired in week 1
    const history = [weekWithPair(1, 'ph', alice, dan)];

    const sourcePair = pair('p1', alice, bob);
    const targetPair = pair('p2', carol, dan);

    // Swapping Alice with Carol: Alice would join Dan in target pair
    const result = checkSwapWarning(sourcePair, alice, targetPair, carol, history);
    expect(result).not.toBeNull();
    expect(result?.member1).toBe('Alice');
    expect(result?.member2).toBe('Dan');
    expect(result?.weekNumber).toBe(1);
  });

  it('warns when toMember has history with a remaining source-pair member', () => {
    const alice = member('a', 'Alice');
    const bob = member('b', 'Bob');
    const carol = member('c', 'Carol');
    const dan = member('d', 'Dan');

    // Carol and Bob were paired in week 2
    const history = [weekWithPair(2, 'ph', carol, bob)];

    const sourcePair = pair('p1', alice, bob);
    const targetPair = pair('p2', carol, dan);

    // Swapping Alice with Carol: Carol would join Bob in source pair
    const result = checkSwapWarning(sourcePair, alice, targetPair, carol, history);
    expect(result).not.toBeNull();
    expect(result?.member1).toBe('Carol');
    expect(result?.member2).toBe('Bob');
    expect(result?.weekNumber).toBe(2);
  });

  it('correctly names member3 of a trio when the conflict is with the third person', () => {
    const alice = member('a', 'Alice');
    const bob = member('b', 'Bob');
    const carol = member('c', 'Carol');
    const dan = member('d', 'Dan');
    const eve = member('e', 'Eve');

    // Alice and Eve were paired before
    const history = [weekWithPair(1, 'ph', alice, eve)];

    const sourcePair = pair('p1', alice, bob);
    // Target is a trio: Carol, Dan, Eve
    const targetPair = pair('p2', carol, dan, eve);

    // Swapping Alice with Carol: Alice would join Dan and Eve — Alice + Eve is a repeat
    const result = checkSwapWarning(sourcePair, alice, targetPair, carol, history);
    expect(result).not.toBeNull();
    expect(result?.member1).toBe('Alice');
    expect(result?.member2).toBe('Eve'); // must be Eve, not blank
  });

  it('returns the first warning found (fromMember direction takes priority)', () => {
    const alice = member('a', 'Alice');
    const bob = member('b', 'Bob');
    const carol = member('c', 'Carol');
    const dan = member('d', 'Dan');

    // Both directions have history
    const history = [
      weekWithPair(1, 'ph1', alice, dan),  // Alice and Dan were paired
      weekWithPair(2, 'ph2', carol, bob),  // Carol and Bob were paired
    ];

    const sourcePair = pair('p1', alice, bob);
    const targetPair = pair('p2', carol, dan);

    // fromMember (Alice) check runs first
    const result = checkSwapWarning(sourcePair, alice, targetPair, carol, history);
    expect(result).not.toBeNull();
    expect(result?.member1).toBe('Alice');
  });
});
