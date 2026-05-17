import React from 'react';
import { Github, Users, ExternalLink } from 'lucide-react';
import { InfoPageShell } from '../components/InfoPageShell';
import type { AppPage } from '../lib/navigation';

interface CommunityProps {
  onNavigate: (page: AppPage) => void;
}

export function Community({ onNavigate }: CommunityProps) {
  return (
    <InfoPageShell
      title="Community"
      subtitle="Connect with other learners building their skill paths"
      onBack={() => onNavigate('dashboard')}
    >
      <div className="space-y-8">
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">SkillNexus community</h2>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            A dedicated forum is not required for core product use. Share feedback, report issues, and follow project
            updates on GitHub. For product help, use the Support page.
          </p>
        </section>

        <div className="grid gap-4">
          <a
            href="https://github.com/ayesha-saaed"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-zinc-300" />
              <div>
                <h3 className="text-sm font-bold text-white">GitHub</h3>
                <p className="text-xs text-zinc-500">Source, issues, and contributions</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 shrink-0" />
          </a>
          <button
            type="button"
            onClick={() => onNavigate('support')}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-5 hover:border-blue-500/20 hover:bg-blue-500/5 transition-colors text-left w-full"
          >
            <div>
              <h3 className="text-sm font-bold text-white">Support</h3>
              <p className="text-xs text-zinc-500">Account help and learning path questions</p>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 shrink-0" />
          </button>
        </div>
      </div>
    </InfoPageShell>
  );
}
