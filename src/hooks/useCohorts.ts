import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Cohort } from '@/types';

export function useCohorts() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCohorts = async () => {
    try {
      const { data, error } = await supabase
        .from('cohorts')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setCohorts(data ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCohorts(); }, []);

  const addCohort = async (name: string): Promise<Cohort> => {
    const { data, error } = await supabase
      .from('cohorts')
      .insert({ name: name.trim() })
      .select()
      .single();
    if (error) throw error;
    setCohorts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  };

  const updateCohort = async (id: string, name: string) => {
    const { error } = await supabase
      .from('cohorts')
      .update({ name: name.trim() })
      .eq('id', id);
    if (error) throw error;
    setCohorts(prev =>
      prev.map(c => c.id === id ? { ...c, name: name.trim() } : c)
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const deleteCohort = async (id: string) => {
    const { error } = await supabase
      .from('cohorts')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setCohorts(prev => prev.filter(c => c.id !== id));
  };

  return { cohorts, isLoading, addCohort, updateCohort, deleteCohort, refetch: fetchCohorts };
}
