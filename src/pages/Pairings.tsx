import { useState } from 'react';
import { useYearContext } from '@/contexts/YearContext';
import { useMembers } from '@/hooks/useMembers';
import { useRequests } from '@/hooks/useRequests';
import { usePairings } from '@/hooks/usePairings';
import { RequestsQueue } from '@/components/pairings/RequestsQueue';
import { PairingReceipt } from '@/components/pairings/PairingReceipt';
import { OverrideDialog } from '@/components/pairings/OverrideDialog';
import { GooseLarge } from '@/components/icons/Goose';
import { generatePairings } from '@/utils/pairingAlgorithm';
import { formatDate } from '@/lib/utils';
import type { Pair, PairingWeek } from '@/types';

export function PairingsPage() {
  const { activeYear } = useYearContext();
  const { members } = useMembers(activeYear?.id ?? null);
  const { requests, isLoading: requestsLoading, addRequest, deleteRequest, clearRequests } = useRequests(activeYear?.id ?? null);
  const { weeks, isLoading, saveWeek, updateWeekPairs, deleteWeek, nextWeekNumber } = usePairings(activeYear?.id ?? null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [editingWeek, setEditingWeek] = useState<PairingWeek | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set(weeks.slice(0, 1).map(w => w.id)));
  const [deletingWeekId, setDeletingWeekId] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);

  const activeMembers = members.filter(m => m.is_active && !m.is_deleted);

  const toggleExpanded = (weekId: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (activeMembers.length < 2) {
      setGenerateError('Need at least 2 active members to generate pairings.');
      return;
    }
    setGenerateError(null);
    setIsGenerating(true);
    try {
      const { pairs } = generatePairings({
        activeMembers,
        requests,
        history: weeks,
      });

      const saved = await saveWeek(nextWeekNumber, dateInput, pairs);
      await clearRequests();
      setExpandedWeeks(prev => new Set([...prev, saved.id]));
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOverride = async (updatedPairs: Pair[]) => {
    if (!editingWeek) return;
    await updateWeekPairs(editingWeek.id, updatedPairs);
    setEditingWeek(null);
  };

  const handleDeleteWeek = async (weekId: string) => {
    try {
      await deleteWeek(weekId);
      setDeletingWeekId(null);
    } catch (err: unknown) {
      // silently fail — week stays visible
    }
  };

  if (!activeYear) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <GooseLarge className="mb-4" />
        <h2 className="font-serif text-2xl font-black text-cream mb-2 uppercase tracking-tight">No year selected</h2>
        <p className="text-xs text-cream/40 font-mono tracking-wide">Use the year selector in the header to get started.</p>
      </div>
    );
  }

  const latestWeekId = weeks[0]?.id;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      <div className="mb-7">
        <h1 className="font-serif text-[40px] font-black tracking-tight text-cream uppercase leading-none">
          Pairings
        </h1>
        <p className="font-mono text-[10px] text-cream/35 mt-1.5 tracking-widest uppercase">
          {activeYear.label} · {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
        </p>
      </div>

      <RequestsQueue
        activeMembers={activeMembers}
        requests={requests}
        isLoading={requestsLoading}
        addRequest={addRequest}
        deleteRequest={deleteRequest}
      />

      <div className="card p-5 mb-7 border-l-4 border-l-yellow">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl font-black tracking-tight text-brown uppercase">
              Generate Week {nextWeekNumber}
            </h2>
            {requests.length > 0 && (
              <p className="font-mono text-[10px] text-brown/50 mt-0.5 tracking-wide">
                {requests.length} pre-assigned pair{requests.length > 1 ? 's' : ''} · {Math.max(0, activeMembers.length - requests.length * 2)} go to algorithm
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input text-xs py-1.5 px-2 w-36"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <button
                onClick={handleGenerate}
                className="btn-label"
                disabled={isGenerating || activeMembers.length < 2}
              >
                {isGenerating ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {generateError && (
          <p className="font-mono text-[11px] text-rust-dark mt-2 flex items-center gap-1.5">
            <span>⚠</span> {generateError}
          </p>
        )}
      </div>

      <div>
        <h2 className="section-label-dark mb-4">History</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-ink-light rounded animate-pulse" />)}
          </div>
        ) : weeks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GooseLarge className="mb-3" />
            <p className="font-serif text-2xl font-black text-cream mb-1 uppercase tracking-tight">No pairings yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {weeks.map(week => (
              <div key={week.id}>
                {deletingWeekId === week.id ? (
                  <div className="card p-4 border-rust/20 bg-rust/5 animate-fade-in">
                    <p className="text-sm text-rust-dark mb-3">
                      Delete Week {week.week_number} ({formatDate(week.date)})? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteWeek(week.id)} className="btn-danger">Delete</button>
                      <button onClick={() => setDeletingWeekId(null)} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <PairingReceipt
                    week={week}
                    isExpanded={expandedWeeks.has(week.id)}
                    onToggle={() => toggleExpanded(week.id)}
                    onEdit={() => setEditingWeek(week)}
                    onDelete={() => setDeletingWeekId(week.id)}
                    isLatest={week.id === latestWeekId}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editingWeek && (
        <OverrideDialog
          week={editingWeek}
          history={weeks}
          onSave={handleSaveOverride}
          onClose={() => setEditingWeek(null)}
        />
      )}
    </div>
  );
}
