import React, { useState, useEffect } from 'react';
import { Users, Award, BookOpen, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from './useToast';

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalDomains: number;
  totalSkills: number;
  totalResources: number;
  activeUsers: number;
}

export function AdminAnalytics() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalDomains: 0,
    totalSkills: 0,
    totalResources: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);

      const [profilesData, domainsData, skillsData, resourcesData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('domains').select('*', { count: 'exact', head: true }),
        supabase.from('skills').select('*', { count: 'exact', head: true }),
        supabase.from('resources').select('*', { count: 'exact', head: true })
      ]);

      const adminCount = profilesData.data?.filter((p: any) => p.role === 'admin').length || 0;
      const activeCount = profilesData.data?.filter((p: any) => p.level > 1).length || 0;

      setStats({
        totalUsers: profilesData.count || 0,
        totalAdmins: adminCount,
        totalDomains: domainsData.count || 0,
        totalSkills: skillsData.count || 0,
        totalResources: resourcesData.count || 0,
        activeUsers: activeCount
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch stats', 'error');
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-600/20',
      textColor: 'text-blue-300',
      iconColor: 'text-blue-400'
    },
    {
      label: 'Admin Users',
      value: stats.totalAdmins,
      icon: Award,
      color: 'red',
      bgColor: 'bg-red-600/20',
      textColor: 'text-red-300',
      iconColor: 'text-red-400'
    },
    {
      label: 'Active Users',
      value: stats.activeUsers,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-600/20',
      textColor: 'text-green-300',
      iconColor: 'text-green-400'
    },
    {
      label: 'Total Domains',
      value: stats.totalDomains,
      icon: BookOpen,
      color: 'purple',
      bgColor: 'bg-purple-600/20',
      textColor: 'text-purple-300',
      iconColor: 'text-purple-400'
    },
    {
      label: 'Total Skills',
      value: stats.totalSkills,
      icon: Zap,
      color: 'yellow',
      bgColor: 'bg-yellow-600/20',
      textColor: 'text-yellow-300',
      iconColor: 'text-yellow-400'
    },
    {
      label: 'Total Resources',
      value: stats.totalResources,
      icon: Award,
      color: 'cyan',
      bgColor: 'bg-cyan-600/20',
      textColor: 'text-cyan-300',
      iconColor: 'text-cyan-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`${card.bgColor} border border-white/10 rounded-lg p-6 transition-all hover:border-white/20`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{card.label}</p>
                  <p className="text-3xl font-black text-white">{loading ? '-' : card.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${card.iconColor} opacity-50`} />
              </div>
            </div>
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
                    width: stats.totalDomains > 0 ? `${Math.min((stats.totalSkills / (stats.totalDomains * 10)) * 100, 100)}%` : '0%'
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {stats.totalDomains > 0 ? `${(stats.totalSkills / stats.totalDomains).toFixed(1)}` : '0'} skills per domain
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Resources per Skill Ratio</p>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: stats.totalSkills > 0 ? `${Math.min((stats.totalResources / (stats.totalSkills * 5)) * 100, 100)}%` : '0%'
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {stats.totalSkills > 0 ? `${(stats.totalResources / stats.totalSkills).toFixed(1)}` : '0'} resources per skill
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
                <p className="text-sm text-zinc-300">Skill Coverage</p>
                <p className="text-lg font-black text-purple-400">{stats.totalSkills}</p>
              </div>
              <p className="text-xs text-zinc-500">Skills available for learning</p>
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
              {stats.totalDomains > 0 ? (stats.totalSkills / stats.totalDomains).toFixed(1) : '0'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Avg Skills/Domain</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-yellow-400">
              {stats.totalSkills > 0 ? (stats.totalResources / stats.totalSkills).toFixed(1) : '0'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Avg Resources/Skill</p>
          </div>
        </div>
      </div>
    </div>
  );
}
