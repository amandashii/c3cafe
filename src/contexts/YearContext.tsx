import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useYears } from '@/hooks/useYears';
import type { Year } from '@/types';

interface YearContextValue {
  years: Year[];
  activeYear: Year | null;
  setActiveYear: (year: Year) => void;
  isLoading: boolean;
  addYear: (label: string) => Promise<Year>;
  updateYear: (id: string, label: string) => Promise<void>;
  deleteYear: (id: string) => Promise<void>;
}

const YearContext = createContext<YearContextValue | null>(null);

export function YearProvider({ children }: { children: ReactNode }) {
  const { years, isLoading, addYear, updateYear, deleteYear } = useYears();
  const [activeYear, setActiveYearState] = useState<Year | null>(null);

  useEffect(() => {
    if (!isLoading && years.length > 0) {
      setActiveYearState(prev => prev ?? years[0]);
    }
  }, [years, isLoading]);

  const setActiveYear = (year: Year) => {
    setActiveYearState(year);
  };

  const handleDeleteYear = async (id: string) => {
    await deleteYear(id);
    // If we deleted the active year, switch to the next available
    if (activeYear?.id === id) {
      const remaining = years.filter(y => y.id !== id);
      setActiveYearState(remaining.length > 0 ? remaining[0] : null);
    }
  };

  return (
    <YearContext.Provider value={{
      years,
      activeYear,
      setActiveYear,
      isLoading,
      addYear,
      updateYear,
      deleteYear: handleDeleteYear,
    }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYearContext() {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error('useYearContext must be used within YearProvider');
  return ctx;
}
