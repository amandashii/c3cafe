import { Pencil, Trash2, ChevronDown } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { PairingWeek } from '@/types';

interface PairingReceiptProps {
  week: PairingWeek;
  isExpanded?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isLatest?: boolean;
}

export function PairingReceipt({
  week,
  isExpanded = true,
  onToggle,
  onEdit,
  onDelete,
  isLatest = false,
}: PairingReceiptProps) {
  const cohortColors = (cohort: string) => {
    const hash = cohort.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return hash % 2 === 0 ? 'cohort-badge' : 'cohort-badge-alt';
  };

  return (
    <div className={cn('receipt animate-fade-in', isLatest && 'ring-2 ring-yellow/40')}>

      <div className="receipt-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-brown/50">
              Week {String(week.week_number).padStart(2, '0')}
            </span>
            {isLatest && (
              <span className="badge-sticker">latest</span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {onEdit && (
              <button onClick={onEdit} className="btn-icon p-1" title="Edit pairings">
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="btn-icon p-1 hover:text-rust-dark"
                title="Delete week"
              >
                <Trash2 size={12} />
              </button>
            )}
            {onToggle && (
              <button onClick={onToggle} className="btn-icon p-1">
                <ChevronDown size={13} className={cn('transition-transform duration-200', isExpanded && 'rotate-180')} />
              </button>
            )}
          </div>
        </div>

        <p className="font-serif text-lg font-black tracking-tight text-brown mt-0.5 uppercase">
          {formatDate(week.date)}
        </p>
        <p className="font-mono text-[10px] text-brown/40 mt-0.5 tracking-wide">
          {week.pairs.length} pair{week.pairs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isExpanded && (
        <div>
          {week.pairs.map((pair, i) => (
            <div key={pair.id} className="receipt-row">
              <span className="font-mono text-[10px] text-tan-dark w-5 shrink-0 select-none tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <PairMemberChip
                  name={pair.member1.name}
                  cohort={pair.member1.cohort_name}
                  colorClass={cohortColors(pair.member1.cohort_name)}
                />
                {pair.member2 && (
                  <>
                    <span className="font-mono text-[10px] text-tan/70">×</span>
                    <PairMemberChip
                      name={pair.member2.name}
                      cohort={pair.member2.cohort_name}
                      colorClass={cohortColors(pair.member2.cohort_name)}
                    />
                  </>
                )}
                {pair.member3 && (
                  <>
                    <span className="font-mono text-[10px] text-tan/70">×</span>
                    <PairMemberChip
                      name={pair.member3.name}
                      cohort={pair.member3.cohort_name}
                      colorClass={cohortColors(pair.member3.cohort_name)}
                    />
                  </>
                )}
              </div>
            </div>
          ))}

          <div className="px-4 py-3 border-t border-dashed border-tan/40">
            <p className="font-mono text-[9px] text-brown/30 tracking-[0.12em] uppercase text-center">
              C3 Cafe · Coffee Chat Admin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PairMemberChip({ name, cohort, colorClass }: { name: string; cohort: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-brown font-medium">{name}</span>
      {cohort && <span className={cn(colorClass, 'text-xs')}>{cohort}</span>}
    </div>
  );
}
