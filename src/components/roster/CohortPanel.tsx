import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useCohorts } from '@/hooks/useCohorts';

export function CohortPanel() {
  const { cohorts, isLoading, addCohort, updateCohort, deleteCohort } = useCohorts();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await addCohort(newName.trim());
      setNewName('');
      setIsAdding(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add cohort');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setIsSubmitting(true);
    try {
      await updateCohort(id, editName.trim());
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteCohort(id);
      setDeletingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-4 border-l-4 border-l-sage">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-sm font-black tracking-tight text-brown uppercase">Cohorts</h2>
        <button
          onClick={() => { setIsAdding(true); setNewName(''); }}
          className="btn-icon"
          title="Add cohort"
        >
          <Plus size={15} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-7 bg-cream-darker rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          {cohorts.map(cohort => (
            <li key={cohort.id} className="group">
              {editingId === cohort.id ? (
                <div className="flex items-center gap-1">
                  <input
                    className="input text-xs py-1 px-2 flex-1"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleUpdate(cohort.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(cohort.id)} className="btn-icon p-1" disabled={isSubmitting}>
                    <Check size={12} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-icon p-1">
                    <X size={12} />
                  </button>
                </div>
              ) : deletingId === cohort.id ? (
                <div className="rounded bg-rust/5 border border-rust/15 p-2">
                  <p className="text-xs text-rust-dark mb-2">Delete "{cohort.name}"?<br/>Members keep their cohort label.</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleDelete(cohort.id)} className="btn-danger text-xs px-2 py-0.5" disabled={isSubmitting}>
                      {isSubmitting ? '…' : 'Delete'}
                    </button>
                    <button onClick={() => setDeletingId(null)} className="btn-ghost text-xs px-2 py-0.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1 px-1 rounded hover:bg-cream-darker transition-colors">
                  <span className="cohort-badge text-xs">{cohort.name}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="btn-icon p-1"
                      onClick={() => { setEditingId(cohort.id); setEditName(cohort.name); }}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      className="btn-icon p-1 hover:text-rust-dark"
                      onClick={() => setDeletingId(cohort.id)}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}

          {cohorts.length === 0 && !isAdding && (
            <p className="text-xs text-brown-light/50 py-1">No cohorts yet.</p>
          )}
        </ul>
      )}

      {isAdding && (
        <div className="mt-2 flex items-center gap-1">
          <input
            className="input text-xs py-1 px-2 flex-1"
            placeholder="e.g. Fall 25"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setIsAdding(false); setNewName(''); }
            }}
            autoFocus
          />
          <button onClick={handleAdd} className="btn-icon p-1" disabled={isSubmitting || !newName.trim()}>
            <Check size={12} />
          </button>
          <button onClick={() => { setIsAdding(false); setNewName(''); }} className="btn-icon p-1">
            <X size={12} />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-rust-dark mt-2">{error}</p>}
    </div>
  );
}
