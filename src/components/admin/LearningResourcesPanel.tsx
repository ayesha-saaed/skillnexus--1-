import React from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import type { LinkedResource } from '../../lib/resourceLinking';
import { countLabel } from '../../lib/resourceLinking';

interface LearningResourcesPanelProps {
  title?: string;
  resources: LinkedResource[];
  emptyHint?: string;
  loading?: boolean;
  /** Scrollable list max height (Tailwind class). Default max-h-48 */
  listMaxHeightClass?: string;
  footer?: React.ReactNode;
}

export function LearningResourcesPanel({
  title = 'Learning resources',
  resources,
  emptyHint = 'No resources match this domain/skills yet. Add resources under Admin → Resources with the same domain and skills.',
  loading = false,
  listMaxHeightClass = 'max-h-48',
  footer
}: LearningResourcesPanelProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">{title}</h4>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {loading ? '…' : countLabel(resources.length)}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading resources…</p>
      ) : resources.length === 0 ? (
        <p className="text-sm text-zinc-500 leading-relaxed">{emptyHint}</p>
      ) : (
        <ul className={`${listMaxHeightClass} overflow-y-auto divide-y divide-white/10 rounded-lg border border-white/5`}>
          {resources.map((res) => (
            <li key={res.id} className="px-3 py-2.5 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{res.title}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {res.type} · {res.difficulty}
                    {res.domain ? ` · ${res.domain}` : ''}
                    {res.matchReason === 'skill' && (
                      <span className="text-amber-500/80"> · matched by skill</span>
                    )}
                    {res.matchReason === 'both' && (
                      <span className="text-emerald-500/80"> · domain + skill</span>
                    )}
                  </p>
                  {(res.skills_covered || []).length > 0 && (
                    <p className="text-[10px] text-zinc-600 mt-1 truncate">
                      {(res.skills_covered || []).join(', ')}
                    </p>
                  )}
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10"
                  title="Open resource"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      {footer}
    </div>
  );
}
