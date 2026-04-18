import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useYearContext } from '@/contexts/YearContext';
import { cn } from '@/lib/utils';

export function YearSelector() {
  const { years, activeYear, setActiveYear, addYear, updateYear, deleteYear } = useYearContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setEditingId(null);
        setDeletingId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  const handleAdd = async () => {
    if (!newLabel.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const year = await addYear(newLabel.trim());
      setActiveYear(year);
      setNewLabel('');
      setIsAdding(false);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editLabel.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateYear(id, editLabel.trim());
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteYear(id);
      setDeletingId(null);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono tracking-wide transition-colors',
          'bg-ink-light border-ink-lighter text-cream/50 hover:border-cream/20 hover:text-cream/75',
          isOpen && 'border-cream/25 text-cream/80'
        )}
      >
        <span>
          {activeYear?.label ?? 'Select year'}
        </span>
        <ChevronDown
          size={13}
          className={cn('text-cream/30 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 w-56 card shadow-card-hover animate-slide-down py-1">
          <p className="section-label px-3 pt-2 pb-1.5">Years</p>

          {years.length === 0 && !isAdding && (
            <p className="px-3 py-2 text-xs text-brown-light/60">No years yet.</p>
          )}

          {years.map(year => (
            <div key={year.id} className="group">
              {editingId === year.id ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input
                    className="input text-xs py-1 px-2 flex-1"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleUpdate(year.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(year.id)} className="btn-icon p-1" disabled={isSubmitting}>
                    <Check size={13} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-icon p-1">
                    <X size={13} />
                  </button>
                </div>
              ) : deletingId === year.id ? (
                <div className="px-3 py-2">
                  <p className="text-xs text-rust-dark mb-2">Delete "{year.label}"? This removes all its members and pairings.</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDelete(year.id)}
                      className="btn-danger text-xs px-2 py-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '…' : 'Delete'}
                    </button>
                    <button onClick={() => setDeletingId(null)} className="btn-ghost text-xs px-2 py-1">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-cream-darker rounded-sm mx-1',
                    activeYear?.id === year.id && 'bg-cream-darker'
                  )}
                  onClick={() => { setActiveYear(year); setIsOpen(false); }}
                >
                  <span className="text-sm font-mono">{year.label}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="btn-icon p-1"
                      onClick={e => { e.stopPropagation(); setEditingId(year.id); setEditLabel(year.label); }}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      className="btn-icon p-1 hover:text-rust-dark"
                      onClick={e => { e.stopPropagation(); setDeletingId(year.id); }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <hr className="border-tan/40 my-1" />

          {isAdding ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                ref={addInputRef}
                className="input text-xs py-1 px-2 flex-1"
                placeholder="e.g. 2025–2026"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setIsAdding(false); setNewLabel(''); }
                }}
              />
              <button onClick={handleAdd} className="btn-icon p-1" disabled={isSubmitting || !newLabel.trim()}>
                <Check size={13} />
              </button>
              <button onClick={() => { setIsAdding(false); setNewLabel(''); }} className="btn-icon p-1">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-brown-light hover:text-brown hover:bg-cream-darker rounded-sm mx-1 transition-colors"
              style={{ width: 'calc(100% - 8px)' }}
            >
              <Plus size={13} />
              New year
            </button>
          )}
        </div>
      )}
    </div>
  );
}
