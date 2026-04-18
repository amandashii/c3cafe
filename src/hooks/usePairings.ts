import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { PairingWeek, Pair, PairMember } from '@/types';

type MemberWithCohort = { id: string; name: string; cohorts: { name: string } | null };
type PairingRow = Database['public']['Tables']['pairings']['Row'] & {
  member1: MemberWithCohort | null;
  member2: MemberWithCohort | null;
  member3: MemberWithCohort | null;
};

function buildMember(raw: MemberWithCohort | null, fallbackId: string): PairMember {
  return {
    id: raw?.id ?? fallbackId,
    name: raw?.name ?? 'Former member',
    cohort_name: raw?.cohorts?.name ?? '',
  };
}

export function usePairings(yearId: string | null) {
  const [weeks, setWeeks] = useState<PairingWeek[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPairings = async () => {
    if (!yearId) {
      setWeeks([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data: weeksData, error: weeksError } = await supabase
        .from('pairing_weeks')
        .select('*')
        .eq('year_id', yearId)
        .order('week_number', { ascending: false });
      if (weeksError) throw weeksError;

      if (!weeksData || weeksData.length === 0) {
        setWeeks([]);
        setIsLoading(false);
        return;
      }

      const { data: pairingsData, error: pairingsError } = await supabase
        .from('pairings')
        .select(`
          *,
          member1:members!pairings_member1_id_fkey(id, name, cohorts(name)),
          member2:members!pairings_member2_id_fkey(id, name, cohorts(name)),
          member3:members!pairings_member3_id_fkey(id, name, cohorts(name))
        `)
        .in('week_id', weeksData.map(w => w.id));
      if (pairingsError) throw pairingsError;

      const typedPairings = (pairingsData ?? []) as PairingRow[];

      const result: PairingWeek[] = weeksData.map(w => ({
        id: w.id,
        year_id: w.year_id,
        week_number: w.week_number,
        date: w.date,
        pairs: typedPairings
          .filter(p => p.week_id === w.id)
          .map(p => {
            const pair: Pair = {
              id: p.id,
              week_id: p.week_id,
              member1: buildMember(p.member1, p.member1_id),
              is_manual: p.is_manual,
            };
            if (p.member2_id) pair.member2 = buildMember(p.member2, p.member2_id);
            if (p.member3_id) pair.member3 = buildMember(p.member3, p.member3_id);
            return pair;
          }),
      }));

      setWeeks(result);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchPairings();
  }, [yearId]);

  const saveWeek = async (weekNumber: number, date: string, pairs: Omit<Pair, 'id' | 'week_id'>[]): Promise<PairingWeek> => {
    if (!yearId) throw new Error('No year selected');

    const { data: weekData, error: weekError } = await supabase
      .from('pairing_weeks')
      .insert({ year_id: yearId, week_number: weekNumber, date })
      .select()
      .single();
    if (weekError) throw weekError;

    const pairingsToInsert = pairs.map(p => ({
      week_id: weekData.id,
      member1_id: p.member1.id,
      member2_id: p.member2?.id ?? null,
      member3_id: p.member3?.id ?? null,
      is_manual: p.is_manual ?? false,
    }));

    const { data: savedPairings, error: pairError } = await supabase
      .from('pairings')
      .insert(pairingsToInsert)
      .select();
    if (pairError) throw pairError;

    const saved: PairingWeek = {
      id: weekData.id,
      year_id: weekData.year_id,
      week_number: weekData.week_number,
      date: weekData.date,
      pairs: pairs.map((p, i) => ({ ...p, id: savedPairings[i].id, week_id: weekData.id })),
    };

    setWeeks(prev => [saved, ...prev]);
    return saved;
  };

  const updateWeekPairs = async (weekId: string, pairs: Pair[]) => {
    // Delete then re-insert for simplicity and correctness
    const { error: delError } = await supabase.from('pairings').delete().eq('week_id', weekId);
    if (delError) throw delError;

    const pairingsToInsert = pairs.map(p => ({
      week_id: weekId,
      member1_id: p.member1.id,
      member2_id: p.member2?.id ?? null,
      member3_id: p.member3?.id ?? null,
      is_manual: p.is_manual ?? false,
    }));

    const { data: inserted, error: insError } = await supabase
      .from('pairings')
      .insert(pairingsToInsert)
      .select();
    if (insError) throw insError;

    const updatedPairs = pairs.map((p, i) => ({ ...p, id: inserted[i].id }));
    setWeeks(prev => prev.map(w => w.id === weekId ? { ...w, pairs: updatedPairs } : w));
    return updatedPairs;
  };

  const deleteWeek = async (weekId: string) => {
    // Cascade delete handles pairings via FK
    const { error } = await supabase.from('pairing_weeks').delete().eq('id', weekId);
    if (error) throw error;
    setWeeks(prev => prev.filter(w => w.id !== weekId));
  };

  const nextWeekNumber = weeks.length > 0
    ? Math.max(...weeks.map(w => w.week_number)) + 1
    : 1;

  return { weeks, isLoading, saveWeek, updateWeekPairs, deleteWeek, nextWeekNumber, refetch: fetchPairings };
}
