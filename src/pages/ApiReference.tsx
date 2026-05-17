import React from 'react';
import { Code2, Shield, Server } from 'lucide-react';
import { InfoPageShell } from '../components/InfoPageShell';
import type { AppPage } from '../lib/navigation';

interface ApiReferenceProps {
  onNavigate: (page: AppPage) => void;
}

const endpoints = [
  { method: 'GET', path: '/api/health', auth: 'None', desc: 'Service health check' },
  { method: 'GET', path: '/api/job-roles', auth: 'Optional', desc: 'List job roles for gap analysis' },
  { method: 'GET', path: '/api/trends', auth: 'Optional', desc: 'Industry skill demand trends' },
  { method: 'POST', path: '/api/gap-analysis', auth: 'Bearer', desc: 'Skill gap report for a user and job role' },
  { method: 'GET', path: '/api/admin/users', auth: 'Admin', desc: 'List all user profiles' },
  { method: 'GET', path: '/api/admin/resources', auth: 'Admin', desc: 'List all learning resources' },
  { method: 'POST', path: '/api/admin/resources', auth: 'Admin', desc: 'Create or update a resource' },
  { method: 'DELETE', path: '/api/admin/resources/:id', auth: 'Admin', desc: 'Remove a resource' },
  { method: 'POST', path: '/api/admin/roles', auth: 'Admin', desc: 'Create or update a job role' },
  { method: 'POST', path: '/api/admin/domains', auth: 'Admin', desc: 'Create or update a domain' },
  { method: 'POST', path: '/api/admin/skills', auth: 'Admin', desc: 'Create or update a catalog skill' }
];

export function ApiReference({ onNavigate }: ApiReferenceProps) {
  return (
    <InfoPageShell
      title="API Reference"
      subtitle="REST endpoints served by the SkillNexus dev server"
      onBack={() => onNavigate('dashboard')}
    >
      <div className="space-y-8">
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Base URL</h2>
          </div>
          <p className="text-sm text-zinc-400">
            When running <code className="text-cyan-300/90 bg-white/5 px-1.5 py-0.5 rounded">npm run dev</code>, API
            routes are proxied from the Vite app to Express on the same origin.
          </p>
          <p className="text-xs font-mono text-zinc-500 break-all">{typeof window !== 'undefined' ? window.location.origin : ''}/api/…</p>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Authentication</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Protected routes require <code className="text-zinc-300">Authorization: Bearer &lt;supabase_access_token&gt;</code>.
            Admin routes additionally require <code className="text-zinc-300">profiles.role = admin</code>.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Endpoints</h3>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="px-4 py-3 font-bold">Method</th>
                  <th className="px-4 py-3 font-bold">Path</th>
                  <th className="px-4 py-3 font-bold hidden sm:table-cell">Auth</th>
                  <th className="px-4 py-3 font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {endpoints.map((ep) => (
                  <tr key={ep.path + ep.method} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          ep.method === 'GET'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : ep.method === 'DELETE'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300 whitespace-nowrap">{ep.path}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 hidden sm:table-cell">{ep.auth}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </InfoPageShell>
  );
}
