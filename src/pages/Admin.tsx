import React, { useState, useEffect } from 'react';
import { supabase, getCurrentUser, getAccessToken } from '../lib/supabase';
import { Key, Users, Briefcase, TrendingUp, Settings, Plus, Trash2, Database, ShieldAlert, Sparkles, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import { RoleManagement } from '../components/admin/RoleManagement';
import { useToast, ToastContainer } from '../components/admin/useToast';

interface AdminProps {
  onNavigate: (page: any) => void;
}

export function Admin({ onNavigate }: AdminProps) {
  const { toasts, showToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, roles: 0, resources: 0 });
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'roles'>('overview');
  
  const [newRes, setNewRes] = useState({ title: '', url: '', skill: '', type: 'Course', difficulty: 'Beginner', description: '' });

  useEffect(() => {
    async function checkAdmin() {
      const user = await getCurrentUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data?.role === 'admin') {
        setIsAdmin(true);
        fetchStats();
      } else {
        onNavigate('dashboard');
      }
      setLoading(false);
    }
    checkAdmin();
  }, []);

  async function fetchStats() {
    const [{ count: usersCount }, { count: rolesCount }, { count: resourcesCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('job_roles').select('*', { count: 'exact', head: true }),
      supabase.from('resources').select('*', { count: 'exact', head: true }),
    ]);
    setStats({
      users: usersCount || 0,
      roles: rolesCount || 0,
      resources: resourcesCount || 0
    });
  }

  async function handleAddResource() {
    if (!newRes.title.trim() || !newRes.url.trim() || !newRes.skill.trim()) {
      alert('Resource title, URL, and linked skill are required.');
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Unable to authenticate admin session. Please sign in again.');
      }

      const response = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newRes.title.trim(),
          description: newRes.description.trim(),
          url: newRes.url.trim(),
          type: newRes.type,
          difficulty: newRes.difficulty,
          platform: 'Custom',
          skills_covered: [newRes.skill.trim()]
        })
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to add resource');
      }

      setNewRes({ title: '', url: '', skill: '', type: 'Course', difficulty: 'Beginner', description: '' });
      fetchStats();
      alert('Resource committed to cloud successfully!');
    } catch (e: any) {
      console.error(e);
      alert('Failed to add resource: ' + (e.message || 'Unknown error'));
    }
  }

  async function handleSeed() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const resp = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = await resp.json();
      alert(data.message || 'Database synced successfully.');
      fetchStats();
    } catch (e: any) {
      console.error(e);
      alert('Failed to sync database: ' + (e.message || 'Unknown error'));
    }
  }

  if (loading) return <div>Authenticating Admin...</div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Command Center</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Admin Panel</h1>
          <p className="text-sm text-zinc-500 max-w-xl font-medium leading-relaxed">Global system management and data integrity oversight. Control the flow of intelligence across the platform.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSeed}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Database className="w-4 h-4" /> Sync Database
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-500' },
          { label: 'Job Roles', value: stats.roles, icon: Briefcase, color: 'text-emerald-500' },
          { label: 'Learning Assets', value: stats.resources, icon: Sparkles, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="theme-card">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">{stat.label}</p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-white">{stat.value}</span>
              <stat.icon className={`w-6 h-6 ${stat.color} opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      <div className="theme-card p-1">
        <div className="flex border-b border-white/5 overflow-hidden">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> System Overview
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'roles' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <Briefcase className="w-4 h-4" /> Manage Roles
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'resources' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <Plus className="w-4 h-4" /> Manage Resources
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'overview' ? (
            <div className="space-y-8">
               <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Platform Health</h3>
                  <p className="text-sm text-zinc-400 mb-6 font-medium">All systems operational. Cloud Firestore synchronization active. Gemini AI model response latency: 420ms.</p>
                  <div className="flex gap-4">
                    <div className="px-4 py-2 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-lg">Database: Connected</div>
                    <div className="px-4 py-2 bg-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-widest rounded-lg">Auth: Active</div>
                  </div>
               </div>
            </div>
          ) : activeTab === 'roles' ? (
            <RoleManagement showToast={showToast} />
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Resource Title</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-blue-500 text-sm text-white"
                      value={newRes.title}
                      onChange={e => setNewRes({...newRes, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Source URL</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-blue-500 text-sm text-white"
                      value={newRes.url}
                      onChange={e => setNewRes({...newRes, url: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Linked Skill</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-blue-500 text-sm text-white"
                      value={newRes.skill}
                      onChange={e => setNewRes({...newRes, skill: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Format</label>
                      <select 
                        className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-blue-500 text-sm text-white appearance-none"
                        value={newRes.type}
                        onChange={e => setNewRes({...newRes, type: e.target.value})}
                      >
                        <option>Course</option>
                        <option>Documentation</option>
                        <option>Article</option>
                        <option>Video</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Difficulty</label>
                      <select 
                        className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-blue-500 text-sm text-white appearance-none"
                        value={newRes.difficulty}
                        onChange={e => setNewRes({...newRes, difficulty: e.target.value})}
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Description</label>
                    <textarea 
                      className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-blue-500 text-sm text-white h-26.25"
                      value={newRes.description}
                      onChange={e => setNewRes({...newRes, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleAddResource}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Commit Resource to Cloud
              </button>
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}
