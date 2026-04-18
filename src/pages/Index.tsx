import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MemberRoster } from '@/components/roster/MemberRoster';
import { PairingsPage } from './Pairings';
import type { Tab } from '@/types';

export function IndexPage() {
  const [activeTab, setActiveTab] = useState<Tab>('roster');

  return (
    <div className="min-h-screen bg-ink">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {activeTab === 'roster' ? <MemberRoster /> : <PairingsPage />}
      </main>
    </div>
  );
}
