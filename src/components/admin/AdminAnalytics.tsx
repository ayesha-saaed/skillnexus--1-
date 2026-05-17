import React, { useState, useEffect } from 'react';
import { Users, Award, BookOpen, Zap, TrendingUp, UserCircle, ChevronRight, LayoutGrid } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ShowToastFn } from './useToast';
import type { AdminTab, OpenAdminTabFn } from './adminTab';

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalDomains: number;
  /** Curated taxonomy rows in `public.skills` (admin / domains). */
  catalogSkills: number;
  /** Per-user tags from the main app "My Skills" page (`public.user_skills`). */
  learnerSkillEntries: number;
  totalResources: number;
  activeUsers: number;
}

interface AdminAnalyticsProps {
  showToast: ShowToastFn;
  onOpenTab: OpenAdminTabFn;
}

export function AdminAnalytics({ showToast, onOpenTab }: AdminAnalyticsProps) {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalDomains: 0,
    catalogSkills: 0,
    learnerSkillEntries: 0,
    totalResources: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);

      // `head: true` returns count only — no `data` rows, so do not filter profilesData.data
      // for role/level. Use separate filtered count queries (or a single select of role/level).
      const [profilesData, adminCountRes, activeCountRes, domainsData, skillsData, userSkillsData, resourcesData] =
        await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin'),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('level', 1),
          supabase.from('domains').select('*', { count: 'exact', head: true }),
          supabase.from('skills').select('*', { count: 'exact', head: true }),
          supabase.from('user_skills').select('*', { count: 'exact', head: true }),
          supabase.from('resources').select('*', { count: 'exact', head: true })
        ]);

      if (userSkillsData.error) {
        console.warn('user_skills count (admin may need sql/user_skills_admin_rls.sql):', userSkillsData.error.message);
      }

      setStats({
        totalUsers: profilesData.count || 0,
        totalAdmins: adminCountRes.count || 0,
        totalDomains: domainsData.count || 0,
        catalogSkills: skillsData.count || 0,
        learnerSkillEntries: userSkillsData.error ? 0 : userSkillsData.count ?? 0,
        totalResources: resourcesData.count || 0,
        activeUsers: activeCountRes.count || 0
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch stats', 'error');
    } finally {
      setLoading(false);
    }
  }

  const statCards: {
    label: string;
    value: number;
    icon: typeof Users;
    color: string;
    bgColor: string;
    textColor: string;
    iconColor: string;
    targetTab?: AdminTab;
    openUserDetails?: boolean;
    hint?: string;
  }[] = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-600/20',
      textColor: 'text-blue-300',
      iconColor: 'text-blue-400',
      targetTab: 'users',
      openUserDetails: true,
      hint: 'Open user directory & details'
    },
    {
      label: 'Admin Users',
      value: stats.totalAdmins,
      icon: Award,
      color: 'red',
      bgColor: 'bg-red-600/20',
      textColor: 'text-red-300',
      iconColor: 'text-red-400',
      targetTab: 'users',
      openUserDetails: true,
      hint: 'Manage accounts & roles'
    },
    {
      label: 'Active Users',
      value: stats.activeUsers,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-600/20',
      textColor: 'text-green-300',
      iconColor: 'text-green-400',
      targetTab: 'users',
      openUserDetails: true,
      hint: 'View learners in Users'
    },
    {
      label: 'Total Domains',
      value: stats.totalDomains,
      icon: BookOpen,
      color: 'purple',
      bgColor: 'bg-purple-600/20',
      textColor: 'text-purple-300',
      iconColor: 'text-purple-400',
      targetTab: 'domains',
      hint: 'Edit domains'
    },
    {
      label: 'Learner skills (My Skills)',
      value: stats.learnerSkillEntries,
      icon: UserCircle,
      color: 'amber',
      bgColor: 'bg-amber-600/20',
      textColor: 'text-amber-200',
      iconColor: 'text-amber-400',
      targetTab: 'users',
      openUserDetails: true,
      hint: 'Inspect per-user skills in User details'
    },
    {
      label: 'Curated skills (catalog)',
      value: stats.catalogSkills,
      icon: Zap,
      color: 'yellow',
      bgColor: 'bg-yellow-600/20',
      textColor: 'text-yellow-300',
      iconColor: 'text-yellow-400',
      targetTab: 'skills',
      hint: 'Manage catalog skills'
    },
    {
      label: 'Total Resources',
      value: stats.totalResources,
      icon: Award,
      color: 'cyan',
      bgColor: 'bg-cyan-600/20',
      textColor: 'text-cyan-300',
      iconColor: 'text-cyan-400',
      targetTab: 'resources',
      hint: 'Curate library resources'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const clickable = Boolean(card.targetTab);
          return (
            <button
              key={idx}
              type="button"
              disabled={!clickable}
              onClick={() =>
                card.targetTab &&
                onOpenTab(card.targetTab, card.openUserDetails ? { openUserDetails: true } : undefined)
              }
              className={`text-left w-full ${card.bgColor} border border-white/10 rounded-lg p-6 transition-all ${
                clickable ? 'hover:border-white/25 cursor-pointer hover:bg-white/5' : 'opacity-90 cursor-default'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{card.label}</p>
                  <p className="text-3xl font-black text-white">{loading ? '-' : card.value}</p>
                  {card.hint && (
                    <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
                      {clickable && <ChevronRight className="w-3 h-3 shrink-0 text-zinc-500" />}
                      {card.hint}
                    </p>
                  )}
                </div>
                <Icon className={`w-8 h-8 shrink-0 ${card.iconColor} opacity-50`} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/2 border border-white/10 rounded-lg p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">System Health</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Users per Domain Ratio</p>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: stats.totalDomains > 0 ? `${Math.min((stats.totalUsers / (stats.totalDomains * 10)) * 100, 100)}%` : '0%'
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {stats.totalDomains > 0 ? `${(stats.totalUsers / stats.totalDomains).toFixed(1)}` : '0'} users per domain
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Skills per Domain Ratio</p>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{
                    width: stats.totalDomains > 0 ? `${Math.min((stats.catalogSkills / (stats.totalDomains * 10)) * 100, 100)}%` : '0%'
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {stats.totalDomains > 0 ? `${(stats.catalogSkills / stats.totalDomains).toFixed(1)}` : '0'} curated skills per domain
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Resources per Catalog Skill</p>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: stats.catalogSkills > 0 ? `${Math.min((stats.totalResources / (stats.catalogSkills * 5)) * 100, 100)}%` : '0%'
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {stats.catalogSkills > 0 ? `${(stats.totalResources / stats.catalogSkills).toFixed(1)}` : '0'} resources per catalog skill
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/2 border border-white/10 rounded-lg p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Content Coverage</h3>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-zinc-300">Domain Coverage</p>
                <p className="text-lg font-black text-blue-400">{stats.totalDomains}</p>
              </div>
              <p className="text-xs text-zinc-500">Learning paths defined</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-zinc-300">Learner + catalog</p>
                <p className="text-lg font-black text-purple-400">
                  {stats.learnerSkillEntries} / {stats.catalogSkills}
                </p>
              </div>
              <p className="text-xs text-zinc-500">User tags (My Skills) / curated catalog rows</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-zinc-300">Resource Library</p>
                <p className="text-lg font-black text-green-400">{stats.totalResources}</p>
              </div>
              <p className="text-xs text-zinc-500">Learning materials curated</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/2 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Quick navigation</h3>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Jump to the admin workspace that matches each area.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(
            [
              {
                tab: 'users' as const,
                title: 'User overview',
                desc: 'Directory, search, user details, learner skills',
                openUserDetails: true
              },
              { tab: 'roles' as const, title: 'Job roles', desc: 'Titles, domains, required skills' },
              { tab: 'domains' as const, title: 'Domains', desc: 'Learning paths & categories' },
              { tab: 'skills' as const, title: 'Catalog skills', desc: 'Taxonomy linked to domains' },
              { tab: 'resources' as const, title: 'Resources', desc: 'Library items & metadata' }
            ] as const
          ).map((link) => (
            <button
              key={link.tab}
              type="button"
              onClick={() =>
                onOpenTab(
                  link.tab,
                  'openUserDetails' in link && link.openUserDetails ? { openUserDetails: true } : undefined
                )
              }
              className="flex flex-col items-start text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-4 py-3 transition-colors"
            >
              <span className="text-sm font-bold text-white flex items-center gap-1">
                {link.title}
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </span>
              <span className="text-[11px] text-zinc-500 mt-1 leading-snug">{link.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/2 border border-white/10 rounded-lg p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-blue-400">{((stats.totalAdmins / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%</p>
            <p className="text-xs text-zinc-400 mt-1">Admin Ratio</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-green-400">{((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%</p>
            <p className="text-xs text-zinc-400 mt-1">Active Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-purple-400">
              {stats.totalDomains > 0 ? (stats.catalogSkills / stats.totalDomains).toFixed(1) : '0'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Avg catalog skills / domain</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-yellow-400">
              {stats.catalogSkills > 0 ? (stats.totalResources / stats.catalogSkills).toFixed(1) : '0'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Avg resources / catalog skill</p>
          </div>
        </div>
      </div>
    </div>
  );
}
