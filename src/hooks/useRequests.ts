import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { Request } from '@/types';

type MemberWithCohort = { id: string; name: string; cohorts: { name: string } | null };
type RequestRow = Database['public']['Tables']['requests']['Row'] & {
  member1: MemberWithCohort | null;
  member2: MemberWithCohort | null;
};

function normalizeRequest(row: RequestRow): Request {
  return {
    id: row.id,
    year_id: row.year_id,
    member1_id: row.member1_id,
    member2_id: row.member2_id,
    note: row.note ?? undefined,
    member1_name: row.member1?.name ?? 'Unknown',
    member2_name: row.member2?.name ?? 'Unknown',
    member1_cohort: row.member1?.cohorts?.name ?? '',
    member2_cohort: row.member2?.cohorts?.name ?? '',
    created_at: row.created_at,
  };
}

export function useRequests(yearId: string | null) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    if (!yearId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          member1:members!requests_member1_id_fkey(id, name, cohorts(name)),
          member2:members!requests_member2_id_fkey(id, name, cohorts(name))
        `)
        .eq('year_id', yearId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setRequests((data as RequestRow[]).map(normalizeRequest));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchRequests();
  }, [yearId]);

  const addRequest = async (
    member1Id: string,
    member2Id: string,
    note?: string
  ): Promise<Request> => {
    if (!yearId) throw new Error('No year selected');

    // Prevent duplicate requests for the same pair
    const alreadyExists = requests.some(
      r =>
        (r.member1_id === member1Id && r.member2_id === member2Id) ||
        (r.member1_id === member2Id && r.member2_id === member1Id)
    );
    if (alreadyExists) throw new Error('A request for this pair already exists.');

    const { data, error } = await supabase
      .from('requests')
      .insert({ year_id: yearId, member1_id: member1Id, member2_id: member2Id, note: note || null })
      .select(`
        *,
        member1:members!requests_member1_id_fkey(id, name, cohorts(name)),
        member2:members!requests_member2_id_fkey(id, name, cohorts(name))
      `)
      .single();
    if (error) throw error;
    const newReq = normalizeRequest(data as RequestRow);
    setRequests(prev => [...prev, newReq]);
    return newReq;
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from('requests').delete().eq('id', id);
    if (error) throw error;
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  // Called after generation — clears the queue
  const clearRequests = async () => {
    if (!yearId) return;
    const { error } = await supabase.from('requests').delete().eq('year_id', yearId);
    if (error) throw error;
    setRequests([]);
  };

  return { requests, isLoading, addRequest, deleteRequest, clearRequests, refetch: fetchRequests };
}
