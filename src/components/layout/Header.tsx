import { LogOut } from 'lucide-react';
import { YearSelector } from './YearSelector';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Tab } from '@/types';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { signOut, user } = useAuthContext();

  return (
    <header className="sticky top-0 z-40 bg-ink border-b border-ink-lighter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">

          <div className="shrink-0 flex items-baseline gap-0.5">
            <span className="font-serif text-[22px] font-black tracking-tight text-cream uppercase leading-none">
              C3 Cafe
            </span>
            <span className="font-serif text-[22px] font-black text-yellow leading-none">.</span>
          </div>

          <nav className="flex items-center">
            {(['roster', 'pairings'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={cn(
                  'px-4 py-1.5 text-[10px] font-mono font-medium tracking-[0.2em] uppercase transition-all duration-150',
                  activeTab === tab
                    ? 'bg-cream text-ink rounded-sm'
                    : 'text-cream/35 hover:text-cream/65'
                )}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <YearSelector />
            <button
              onClick={signOut}
              className="p-1.5 rounded text-cream/25 hover:bg-ink-lighter hover:text-cream/55 transition-colors"
              title={`Sign out (${user?.email})`}
            >
              <LogOut size={14} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
