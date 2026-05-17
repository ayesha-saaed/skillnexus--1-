import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

interface InfoPageShellProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function InfoPageShell({ title, subtitle, onBack, children }: InfoPageShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Logo className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white truncate">{title}</h1>
              {subtitle && <p className="text-xs text-zinc-500 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
    </div>
  );
}
