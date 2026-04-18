import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { Member, MemberFormData } from '@/types';

type MemberRow = Database['public']['Tables']['members']['Row'] & {
  cohorts: { id: string; name: string } | null;
};

function normalizeMember(row: MemberRow): Member {
  return {
    id: row.id,
    year_id: row.year_id,
    name: row.name,
    cohort_id: row.cohort_id,
    cohort_name: row.cohorts?.name ?? 'No cohort',
    is_active: row.is_active,
    is_deleted: row.is_deleted,
    created_at: row.created_at,
  };
}

export function useMembers(yearId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = async () => {
    if (!yearId) {
      setMembers([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*, cohorts(id, name)')
        .eq('year_id', yearId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMembers((data as MemberRow[]).map(normalizeMember));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchMembers();
  }, [yearId]);

  const addMember = async (data: MemberFormData): Promise<Member> => {
    if (!yearId) throw new Error('No year selected');
    const { data: row, error } = await supabase
      .from('members')
      .insert({
        year_id: yearId,
        name: data.name.trim(),
        cohort_id: data.cohort_id || null,
        is_active: data.is_active,
      })
      .select('*, cohorts(id, name)')
      .single();
    if (error) throw error;
    const newMember = normalizeMember(row as MemberRow);
    setMembers(prev => [...prev, newMember]);
    return newMember;
  };

  const updateMember = async (id: string, data: MemberFormData) => {
    const { data: row, error } = await supabase
      .from('members')
      .update({
        name: data.name.trim(),
        cohort_id: data.cohort_id || null,
        is_active: data.is_active,
      })
      .eq('id', id)
      .select('*, cohorts(id, name)')
      .single();
    if (error) throw error;
    const updated = normalizeMember(row as MemberRow);
    setMembers(prev => prev.map(m => m.id === id ? updated : m));
  };

  // Soft delete — preserves pairing history display
  const deleteMember = async (id: string) => {
    const { error } = await supabase
      .from('members')
      .update({ is_deleted: true })
      .eq('id', id);
    if (error) throw error;
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const toggleActive = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    const newStatus = !member.is_active;
    const { error } = await supabase
      .from('members')
      .update({ is_active: newStatus })
      .eq('id', id);
    if (error) throw error;
    setMembers(prev => prev.map(m => m.id === id ? { ...m, is_active: newStatus } : m));
    return newStatus;
  };

  return { members, isLoading, addMember, updateMember, deleteMember, toggleActive, refetch: fetchMembers };
}
