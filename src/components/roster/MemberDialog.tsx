import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Member, MemberFormData, Cohort } from '@/types';

interface MemberDialogProps {
  member?: Member;
  cohorts: Cohort[];
  onSave: (data: MemberFormData) => Promise<void>;
  onClose: () => void;
}

export function MemberDialog({ member, cohorts, onSave, onClose }: MemberDialogProps) {
  const [name, setName] = useState(member?.name ?? '');
  const [cohortId, setCohortId] = useState(member?.cohort_id ?? '');
  const [isActive, setIsActive] = useState(member?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!member;

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({ name: name.trim(), cohort_id: cohortId, is_active: isActive });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdrop}
    >
      <div className="card w-full max-w-sm mx-4 p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-black tracking-tight text-brown uppercase">
            {isEditing ? 'Edit member' : 'Add member'}
          </h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="label">Name</label>
            <input
              className="input"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label className="label">Cohort</label>
            <select
              className="input"
              value={cohortId}
              onChange={e => setCohortId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">No cohort</option>
              {cohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="label">Status</label>
            <div className="flex gap-2">
              {[
                { value: true, label: 'Active', desc: 'Included in pairings' },
                { value: false, label: 'Away', desc: 'Temporarily excluded' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setIsActive(opt.value)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded border text-left transition-colors',
                    isActive === opt.value
                      ? 'bg-ink/10 border-ink/30 text-brown font-semibold'
                      : 'bg-cream border-tan text-brown-light hover:border-tan-dark'
                  )}
                  disabled={isSubmitting}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs opacity-70">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 rounded bg-rust/10 border border-rust/20 text-rust-dark text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              className="btn-label"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
