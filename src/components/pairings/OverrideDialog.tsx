import { useState, useEffect } from 'react';
import { X, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { checkSwapWarning } from '@/utils/swapWarning';
import type { SwapWarning } from '@/utils/swapWarning';
import { cn, formatDate } from '@/lib/utils';
import type { Pair, PairingWeek } from '@/types';

interface OverrideDialogProps {
  week: PairingWeek;
  history: PairingWeek[]; // all weeks for this year (for repeat detection)
  onSave: (pairs: Pair[]) => Promise<void>;
  onClose: () => void;
}

export function OverrideDialog({ week, history, onSave, onClose }: OverrideDialogProps) {
  const [pairs, setPairs] = useState<Pair[]>([...week.pairs]);
  const [selectedSlot, setSelectedSlot] = useState<{ pairIdx: number; slot: 'member1' | 'member2' | 'member3' } | null>(null);
  const [warning, setWarning] = useState<SwapWarning | null>(null);
  const [pendingSwap, setPendingSwap] = useState<{ pairIdx: number; slot: 'member1' | 'member2' | 'member3' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History excluding current week (don't warn about pairings in this exact week)
  const historyWithoutThisWeek = history.filter(w => w.id !== week.id);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (warning) { setWarning(null); setPendingSwap(null); }
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [warning, onClose]);

  const getMemberAt = (pairIdx: number, slot: 'member1' | 'member2' | 'member3') => {
    return pairs[pairIdx]?.[slot] ?? null;
  };

  const handleSlotClick = (pairIdx: number, slot: 'member1' | 'member2' | 'member3') => {
    const member = getMemberAt(pairIdx, slot);
    if (!member) return;

    if (!selectedSlot) {
      setSelectedSlot({ pairIdx, slot });
      return;
    }

    const { pairIdx: fromPairIdx, slot: fromSlot } = selectedSlot;
    if (fromPairIdx === pairIdx && fromSlot === slot) {
      setSelectedSlot(null);
      return;
    }

    const fromMember = getMemberAt(fromPairIdx, fromSlot);
    const toMember = getMemberAt(pairIdx, slot);
    if (!fromMember || !toMember) { setSelectedSlot(null); return; }

    const swapWarning = checkSwapWarning(
      pairs[fromPairIdx],
      fromMember,
      pairs[pairIdx],
      toMember,
      historyWithoutThisWeek
    );

    if (swapWarning) {
      setWarning(swapWarning);
      setPendingSwap({ pairIdx, slot });
      return;
    }

    applySwap(fromPairIdx, fromSlot, pairIdx, slot);
  };

  const applySwap = (
    fromPairIdx: number,
    fromSlot: 'member1' | 'member2' | 'member3',
    toPairIdx: number,
    toSlot: 'member1' | 'member2' | 'member3'
  ) => {
    setPairs(prev => {
      const next = prev.map(p => ({ ...p }));
      const fromMember = next[fromPairIdx][fromSlot];
      const toMember = next[toPairIdx][toSlot];
      if (!fromMember || !toMember) return prev;
      (next[fromPairIdx] as any)[fromSlot] = toMember;
      (next[toPairIdx] as any)[toSlot] = fromMember;
      return next;
    });
    setSelectedSlot(null);
    setPendingSwap(null);
    setWarning(null);
  };

  const confirmSwap = () => {
    if (!selectedSlot || !pendingSwap) return;
    applySwap(selectedSlot.pairIdx, selectedSlot.slot, pendingSwap.pairIdx, pendingSwap.slot);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(pairs);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-lg mx-4 animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-tan/50 shrink-0">
          <div>
            <h2 className="font-serif text-xl font-black tracking-tight text-brown uppercase">Edit pairings — Week {week.week_number}</h2>
            <p className="text-xs text-brown-light/60 mt-0.5">Click a name, then click another to swap.</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        {/* Warning banner */}
        {warning && (
          <div className="mx-4 mt-3 px-3 py-3 rounded-md bg-rust/10 border border-rust/25 flex gap-2 shrink-0 animate-slide-down">
            <AlertTriangle size={15} className="text-rust shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-rust-dark font-medium">These two have been paired before</p>
              <p className="text-xs text-brown-light/70 mt-0.5">
                <strong>{warning.member1}</strong> and <strong>{warning.member2}</strong> were
                paired on Week {warning.weekNumber} ({formatDate(warning.date)}). Save anyway?
              </p>
              <div className="flex gap-2 mt-2">
                <button onClick={confirmSwap} className="btn-label" style={{ '--btn-hole-bg': '#E3D0C1' } as React.CSSProperties}>Swap anyway</button>
                <button onClick={() => { setWarning(null); setPendingSwap(null); setSelectedSlot(null); }} className="btn-ghost text-xs px-3 py-1.5">
                  Cancel swap
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pairs list */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {pairs.map((pair, pairIdx) => (
            <div key={pair.id} className="bg-cream rounded border border-tan/50 p-3">
              <div className="flex items-center gap-2 flex-wrap">
                {(['member1', 'member2', 'member3'] as const).map((slot, slotIdx) => {
                  const member = pair[slot];
                  if (!member) return null;
                  const isSelected = selectedSlot?.pairIdx === pairIdx && selectedSlot?.slot === slot;
                  return (
                    <div key={slot} className="flex items-center gap-1.5">
                      {slotIdx > 0 && <ArrowLeftRight size={12} className="text-tan shrink-0" />}
                      <button
                        onClick={() => handleSlotClick(pairIdx, slot)}
                        className={cn(
                          'px-3 py-1.5 rounded border text-sm font-medium transition-all',
                          isSelected
                            ? 'bg-yellow text-ink border-yellow-dark scale-105'
                            : 'bg-cream-dark text-brown border-tan hover:border-tan-dark hover:bg-cream-darker'
                        )}
                      >
                        <div>{member.name}</div>
                        {member.cohort_name && (
                          <div className="text-xs opacity-70 font-normal">{member.cohort_name}</div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-tan/50 shrink-0">
          {error && <p className="text-xs text-rust-dark mb-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">Discard changes</button>
            <button onClick={handleSave} className="btn-label" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
