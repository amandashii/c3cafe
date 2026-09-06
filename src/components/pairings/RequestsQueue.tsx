import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Member, Request } from '@/types';

interface RequestsQueueProps {
  activeMembers: Member[];
  requests: Request[];
  isLoading: boolean;
  addRequest: (member1Id: string, member2Id: string, note?: string) => Promise<Request>;
  deleteRequest: (id: string) => Promise<void>;
}

export function RequestsQueue({ activeMembers, requests, isLoading, addRequest, deleteRequest }: RequestsQueueProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [member1Id, setMember1Id] = useState('');
  const [member2Id, setMember2Id] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!member1Id || !member2Id) {
      setError('Please select both members.');
      return;
    }
    if (member1Id === member2Id) {
      setError('Please select two different members.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await addRequest(member1Id, member2Id);
      setMember1Id('');
      setMember2Id('');
      setIsAdding(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRequest(id);
    } catch {
      // silently fail — user can retry
    }
  };

  const availableForM1 = activeMembers.filter(m => m.id !== member2Id);
  const availableForM2 = activeMembers.filter(m => m.id !== member1Id);

  return (
    <div className="card p-4 mb-4 border-l-4 border-l-dusty-blue">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-serif text-xl font-black tracking-tight text-brown uppercase">Requests</h2>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="btn-label btn-label-blue">
            <Plus size={13} />
            Add request
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="bg-cream-dark rounded border border-tan/60 p-3 mb-3 animate-slide-down">
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="label">Person A</label>
              <select className="input text-xs" value={member1Id} onChange={e => setMember1Id(e.target.value)} disabled={isSubmitting}>
                <option value="">Select…</option>
                {availableForM1.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="label">Person B</label>
              <select className="input text-xs" value={member2Id} onChange={e => setMember2Id(e.target.value)} disabled={isSubmitting}>
                <option value="">Select…</option>
                {availableForM2.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-rust-dark mb-2">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setIsAdding(false); setError(null); }} className="btn-ghost text-xs px-3 py-1.5">
              Cancel
            </button>
            <button onClick={handleAdd} className="btn-label btn-label-blue" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add pair'}
            </button>
          </div>
        </div>
      )}

      {/* Request list */}
      {isLoading ? (
        <div className="h-8 bg-cream-darker rounded animate-pulse" />
      ) : requests.length === 0 ? (
        <p className="text-xs text-brown-light/50 py-1">
          Pre-assign any coffee chat requests before generating!
        </p>
      ) : (
        <ul className="space-y-1.5">
          {requests.map(req => (
            <li
              key={req.id}
              className="flex items-center gap-3 px-3 py-2 bg-cream rounded border border-tan/50 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-brown">{req.member1_name}</span>
                  <span className="text-tan-dark text-xs">×</span>
                  <span className="text-sm font-medium text-brown">{req.member2_name}</span>
                  {req.member1_cohort && (
                    <span className={cn(
                      'cohort-badge text-xs',
                      req.member1_cohort !== req.member2_cohort && 'cohort-badge-alt'
                    )}>
                      {req.member1_cohort !== req.member2_cohort
                        ? `${req.member1_cohort} × ${req.member2_cohort}`
                        : req.member1_cohort}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(req.id)}
                className="btn-icon p-1 opacity-0 group-hover:opacity-100 hover:text-rust-dark shrink-0"
                title="Remove request"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
