import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Year } from '@/types';

export function useYears() {
  const [years, setYears] = useState<Year[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchYears = async () => {
    try {
      const { data, error } = await supabase
        .from('years')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setYears(data ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchYears(); }, []);

  const addYear = async (label: string): Promise<Year> => {
    const { data, error } = await supabase
      .from('years')
      .insert({ label: label.trim() })
      .select()
      .single();
    if (error) throw error;
    setYears(prev => [data, ...prev]);
    return data;
  };

  const updateYear = async (id: string, label: string) => {
    const { error } = await supabase
      .from('years')
      .update({ label: label.trim() })
      .eq('id', id);
    if (error) throw error;
    setYears(prev => prev.map(y => y.id === id ? { ...y, label: label.trim() } : y));
  };

  const deleteYear = async (id: string) => {
    const { error } = await supabase
      .from('years')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setYears(prev => prev.filter(y => y.id !== id));
  };

  return { years, isLoading, addYear, updateYear, deleteYear, refetch: fetchYears };
}
