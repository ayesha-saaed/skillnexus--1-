import React from 'react';
import { Mail, MessageCircle, BookOpen, LifeBuoy } from 'lucide-react';
import { InfoPageShell } from '../components/InfoPageShell';

interface SupportProps {
  onNavigate: (page: string) => void;
}

export function Support({ onNavigate }: SupportProps) {
  return (
    <InfoPageShell
      title="Support"
      subtitle="Help with SkillNexus accounts, skills, and learning paths"
      onBack={() => onNavigate('dashboard')}
    >
      <div className="space-y-8">
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <LifeBuoy className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">How we can help</h2>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            SkillNexus helps you map skills to job roles, track gaps, and discover curated learning resources. For
            account issues, data corrections, or admin access requests, contact the team using the channels below.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="mailto:support@skillnexus.dev?subject=SkillNexus%20Support"
            className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors group"
          >
            <Mail className="w-5 h-5 text-blue-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Email support</h3>
            <p className="text-xs text-zinc-500">support@skillnexus.dev</p>
            <p className="text-[11px] text-zinc-600 mt-2">Typical response within 1–2 business days.</p>
          </a>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="text-left rounded-xl border border-white/10 bg-white/5 p-5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-purple-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Learning resources</h3>
            <p className="text-xs text-zinc-500">Browse the resource library for courses and docs.</p>
          </button>
        </div>

        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Common topics</h3>
          </div>
          <ul className="text-sm text-zinc-400 space-y-2 list-disc list-inside">
            <li>Resetting password — use the login page forgot-password flow (Supabase auth).</li>
            <li>Admin access — your profile must have role <code className="text-zinc-300">admin</code> in Supabase.</li>
            <li>Missing skills or resources — ask an admin to run seed SQL or add catalog entries.</li>
            <li>Gap Checker not saving path — set your active job role in Skill Analysis.</li>
          </ul>
        </section>
      </div>
    </InfoPageShell>
  );
}
