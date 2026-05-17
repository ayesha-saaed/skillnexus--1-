import React from 'react';
import { Target } from 'lucide-react';
import type { LibraryResource } from '../../lib/libraryResources';
import type { Progress } from '../../services/learningService';
import { ResourceLibraryCard } from './ResourceLibraryCard';
import type { DomainStyle } from './ResourceLibraryCard';

interface PracticePlatformsSectionProps {
  platforms: LibraryResource[];
  progress: Record<string, Progress>;
  matchBadge?: string;
  onUpdateProgress: (
    resourceId: string,
    status: 'Not Started' | 'In Progress' | 'Completed',
    incProgress: number
  ) => void;
  domainStyle?: DomainStyle | null;
}

export function PracticePlatformsSection({
  platforms,
  progress,
  matchBadge = 'Practice',
  onUpdateProgress,
  domainStyle
}: PracticePlatformsSectionProps) {
  if (!platforms.length) return null;

  return (
    <div className="space-y-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-violet-400" />
        <h3 className="text-[10px] font-black text-violet-300 uppercase tracking-[0.25em]">Practice Platforms</h3>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          ({platforms.length})
        </span>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">
        Matched to your role&apos;s required skills — use these for hands-on coding practice and interview prep.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {platforms.map((res, i) => (
          <ResourceLibraryCard
            key={res.id}
            res={res}
            index={i}
            domainStyle={domainStyle}
            progress={progress[res.id]}
            matchBadge={matchBadge}
            onUpdateProgress={onUpdateProgress}
          />
        ))}
      </div>
    </div>
  );
}
