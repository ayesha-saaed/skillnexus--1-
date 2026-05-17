import React from 'react';
import { motion } from 'framer-motion';
import {
  Book,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  PlayCircle,
  Trophy,
  Zap,
  Clock
} from 'lucide-react';
import type { LibraryResource } from '../../lib/libraryResources';
import type { Progress } from '../../services/learningService';

export type DomainStyle = {
  name: string;
  color: string;
  bg: string;
};

interface ResourceLibraryCardProps {
  res: LibraryResource;
  index?: number;
  domainStyle?: DomainStyle | null;
  progress?: Progress;
  matchBadge?: string;
  onUpdateProgress: (resourceId: string, status: 'Not Started' | 'In Progress' | 'Completed', progress: number) => void;
}

export function ResourceLibraryCard({
  res,
  index = 0,
  domainStyle,
  progress: userProg,
  matchBadge,
  onUpdateProgress
}: ResourceLibraryCardProps) {
  const isStarted = !!userProg;
  const isCompleted = userProg?.status === 'Completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="theme-card group hover:border-blue-500/30 flex flex-col h-full bg-zinc-900/40 relative"
    >
      <div className={`h-1.5 w-full absolute top-0 left-0 ${domainStyle?.bg || 'bg-zinc-800'}`} />
      {matchBadge && (
        <span className="absolute top-3 right-3 z-10 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          {matchBadge}
        </span>
      )}

      <div className="p-8 pb-4 flex flex-col h-full mt-2">
        <div className="flex items-start justify-between mb-8">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isStarted
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-black/40 border-white/5 text-zinc-500'
            }`}
          >
            {res.type === 'Video' ? (
              <PlayCircle className="w-6 h-6" />
            ) : res.type === 'Article' ? (
              <Book className="w-6 h-6" />
            ) : (
              <GraduationCap className="w-6 h-6" />
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/5 rounded-full">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  res.difficulty === 'Beginner'
                    ? 'bg-emerald-500'
                    : res.difficulty === 'Intermediate'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                }`}
              />
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{res.difficulty}</span>
            </div>
            {(res.rating || 0) >= 4.8 && (
              <div className="flex items-center gap-1 text-amber-500">
                <Trophy className="w-3 h-3" /> <span className="text-[9px] font-black uppercase">Top Rated</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-[9px] font-black uppercase tracking-widest ${domainStyle?.color || 'text-zinc-500'}`}>
                {res.domain || 'General'}
              </span>
              <span className="text-zinc-700 font-black">•</span>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{res.type}</span>
              <span className="text-zinc-700 font-black">•</span>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{res.platform}</span>
            </div>
            <h3 className="text-lg font-black text-white mb-2 leading-tight tracking-tight group-hover:text-blue-400 transition-colors pr-16">
              {res.title}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 font-medium">{res.description}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {res.skillsCovered.map((s) => (
              <span
                key={s}
                className="text-[8px] font-black text-zinc-400 uppercase tracking-widest px-2.5 py-1 bg-white/5 border border-white/5 rounded-md"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Runtime
            </p>
            <p className="text-[10px] font-bold text-zinc-300 uppercase">{res.duration || 'Variable'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Demand
            </p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((b) => (
                <div key={b} className={`h-1 flex-1 rounded-full ${b <= 4 ? 'bg-blue-500' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 space-y-6">
          <div className="space-y-2.5">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                {userProg?.status || 'Ready'}
              </p>
              <p className="text-[10px] font-black text-zinc-500 font-mono">{userProg?.progress || 0}%</p>
            </div>
            <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${userProg?.progress || 0}%` }}
                className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.open(res.url, '_blank');
                onUpdateProgress(
                  res.id,
                  'In Progress',
                  Math.min(100, (userProg?.progress || 0) + 15)
                );
              }}
              className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                isCompleted ? 'bg-white/5 text-white border border-white/10' : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {isCompleted ? 'Relaunch' : isStarted ? 'Continue' : 'Open'}
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            {!isCompleted && (
              <button
                type="button"
                onClick={() => onUpdateProgress(res.id, 'Completed', 100)}
                className={`p-4 rounded-2xl border ${
                  isStarted
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-white/5 border-white/5 text-zinc-600'
                }`}
                title="Mark complete"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
