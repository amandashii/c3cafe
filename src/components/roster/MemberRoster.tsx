import { useState } from 'react';
import { Plus, Pencil, Trash2, Coffee, UserX } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useCohorts } from '@/hooks/useCohorts';
import { useYearContext } from '@/contexts/YearContext';
import { MemberDialog } from './MemberDialog';
import { CohortPanel } from './CohortPanel';
import { GooseLarge } from '@/components/icons/Goose';
import { cn } from '@/lib/utils';
import type { Member, MemberFormData } from '@/types';

export function MemberRoster() {
  const { activeYear } = useYearContext();
  const { members, isLoading, addMember, updateMember, deleteMember, toggleActive } = useMembers(activeYear?.id ?? null);
  const { cohorts } = useCohorts();

  const [dialogMember, setDialogMember] = useState<Member | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'away'>('all');
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = members.filter(m => {
    if (filter === 'active') return m.is_active;
    if (filter === 'away') return !m.is_active;
    return true;
  });

  const activeCount = members.filter(m => m.is_active).length;
  const awayCount = members.filter(m => !m.is_active).length;

  const handleSave = async (data: MemberFormData) => {
    if (dialogMember === 'new') {
      await addMember(data);
    } else if (dialogMember) {
      await updateMember(dialogMember.id, data);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteMember(id);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!activeYear) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <GooseLarge className="mb-4" />
        <h2 className="font-serif text-2xl font-black text-cream mb-2 uppercase tracking-tight">No year selected</h2>
        <p className="font-mono text-[10px] text-cream/40 tracking-widest">Use the year selector in the header to get started.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex gap-6 items-start">

        {/* Left: cohorts panel */}
        <div className="w-52 shrink-0">
          <CohortPanel />
        </div>

        {/* Right: members */}
        <div className="flex-1 min-w-0">

          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-serif text-[40px] font-black tracking-tight text-cream uppercase leading-none">
                Roster
              </h1>
              <p className="font-mono text-[10px] text-cream/35 mt-1.5 tracking-widest uppercase">
                {activeYear.label} · {activeCount} active
                {awayCount > 0 && `, ${awayCount} away`}
              </p>
            </div>
            <button
              onClick={() => setDialogMember('new')}
              className="btn-label"
              style={{ '--btn-hole-bg': '#0E0D0D' } as React.CSSProperties}
            >
              <Plus size={13} />
              Add member
            </button>
          </div>

          {/* Filter tabs — cream pill bar on dark bg */}
          <div className="flex gap-0 mb-5 bg-ink-light p-1 rounded-sm w-fit border border-ink-lighter">
            {(['all', 'active', 'away'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1 rounded-sm font-mono text-[10px] font-medium tracking-widest uppercase transition-all',
                  filter === f
                    ? 'bg-cream text-ink'
                    : 'text-cream/35 hover:text-cream/60'
                )}
              >
                {f}&nbsp;
                <span className="opacity-60">
                  ({f === 'all' ? members.length : f === 'active' ? activeCount : awayCount})
                </span>
              </button>
            ))}
          </div>

          {/* Members list */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-ink-light rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {members.length === 0 && <GooseLarge className="mb-3" />}
              <p className="font-serif text-2xl font-black text-cream mb-1 uppercase tracking-tight">
                {members.length === 0 ? 'No members yet' : `No ${filter} members`}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map(member => (
                <li key={member.id} className="group animate-fade-in">
                  {deletingId === member.id ? (
                    <div className="card p-4 border-rust/20 bg-rust/5">
                      <p className="text-sm text-rust-dark mb-3">
                        Remove <strong>{member.name}</strong>? They'll be hidden from the roster but their pairing history is preserved.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="btn-danger"
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Removing…' : 'Remove'}
                        </button>
                        <button onClick={() => setDeletingId(null)} className="btn-secondary">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="card-hover p-4 flex items-center gap-3">
                      <div
                        className={cn(
                          'w-2.5 h-2.5 rounded-full shrink-0 border',
                          member.is_active
                            ? 'bg-sage border-sage-dark'
                            : 'bg-transparent border-tan'
                        )}
                        title={member.is_active ? 'Active' : 'Away'}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-brown truncate">{member.name}</span>
                          {!member.is_active && (
                            <span className="font-mono text-[9px] tracking-widest uppercase text-brown/40 bg-cream-darker px-2 py-0.5 rounded-sm">away</span>
                          )}
                        </div>
                        {member.cohort_name && member.cohort_name !== 'No cohort' && (
                          <span className="cohort-badge text-xs mt-0.5 inline-block">{member.cohort_name}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleActive(member.id)}
                          className="btn-icon"
                          title={member.is_active ? 'Mark as away' : 'Mark as active'}
                        >
                          {member.is_active ? <UserX size={13} /> : <Coffee size={13} />}
                        </button>
                        <button
                          onClick={() => setDialogMember(member)}
                          className="btn-icon"
                          title="Edit member"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingId(member.id)}
                          className="btn-icon hover:text-rust-dark"
                          title="Remove member"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {dialogMember !== null && (
        <MemberDialog
          member={dialogMember === 'new' ? undefined : dialogMember}
          cohorts={cohorts}
          onSave={handleSave}
          onClose={() => setDialogMember(null)}
        />
      )}
    </div>
  );
}
