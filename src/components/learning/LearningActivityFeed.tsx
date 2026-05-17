import React from 'react';
import { BookOpen, Award, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime, type LearningActivityItem } from '../../services/learningService';
import { Progress } from '../ui/Progress';

interface LearningActivityFeedProps {
  items: LearningActivityItem[];
  loading?: boolean;
  emptyMessage?: string;
  compact?: boolean;
  showProgressBar?: boolean;
  className?: string;
}

export function LearningActivityFeed({
  items,
  loading = false,
  emptyMessage = 'No learning activity yet.',
  compact = false,
  showProgressBar = false,
  className
}: LearningActivityFeedProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-6 text-zinc-500', className)}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-xs">Loading activity…</span>
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className={cn('text-xs text-zinc-500 leading-relaxed py-2', className)}>{emptyMessage}</p>
    );
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((item) => {
        const Icon = item.kind === 'resource' ? BookOpen : Award;
        return (
          <li
            key={item.id}
            className={cn(
              'rounded-lg border border-white/5 bg-black/20',
              compact ? 'px-3 py-2' : 'px-3 py-2.5'
            )}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={cn(
                  'shrink-0 rounded-md p-1.5',
                  item.kind === 'resource' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-100 truncate">{item.title}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{item.subtitle}</p>
                {showProgressBar && item.kind === 'resource' && item.status === 'In Progress' && (
                  <Progress
                    value={item.progressPercent ?? 0}
                    className="mt-2 h-1 bg-white/10"
                    indicatorClassName="bg-emerald-500"
                  />
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 shrink-0">
                {formatRelativeTime(item.timestamp)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
