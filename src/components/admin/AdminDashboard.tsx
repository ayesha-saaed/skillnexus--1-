import React, { useState, useEffect } from 'react';
import { getCurrentUser, supabase } from '../../lib/supabase';
import { ShieldAlert, BarChart3, Database, Users, Briefcase, PackageOpen, LogOut, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { AdminAnalytics } from './AdminAnalytics';
import { DomainManagement } from './DomainManagement';
import { SkillManagement } from './SkillManagement';
import { ResourceManagement } from './ResourceManagement';
import { RoleManagement } from './RoleManagement';
import { UserManagement } from './UserManagement';
import { useToast, ToastContainer } from './useToast';

type AdminTab = 'overview' | 'roles' | 'domains' | 'skills' | 'resources' | 'users';

interface AdminDashboardProps {
  onNavigate: (page: any) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const { toasts, showToast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        onNavigate('login');
        return;
      }

      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();

      if (data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        showToast('Access denied: Admin privileges required', 'error');
        onNavigate('dashboard');
      }
    } catch (err) {
      showToast('Authentication error', 'error');
      onNavigate('login');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      onNavigate('login');
      showToast('Logged out successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Logout failed', 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/20 mb-4 animate-pulse">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-zinc-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const tabs: { id: AdminTab; label: string; icon: typeof ShieldAlert }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'roles', label: 'Roles', icon: Briefcase },
    { id: 'domains', label: 'Domains', icon: Database },
    { id: 'skills', label: 'Skills', icon: PackageOpen },
    { id: 'resources', label: 'Resources', icon: PackageOpen },
    { id: 'users', label: 'Users', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Header */}
      <div className="bg-linear-to-br from-zinc-900 to-black border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Admin Panel</p>
                <h1 className="text-lg font-black text-white">Command Center</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 border border-white/10 text-sm font-medium text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to app
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-white/10 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'text-white border-blue-500 bg-white/2'
                      : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <AdminAnalytics />}
          {activeTab === 'roles' && <RoleManagement />}
          {activeTab === 'domains' && <DomainManagement />}
          {activeTab === 'skills' && <SkillManagement />}
          {activeTab === 'resources' && <ResourceManagement />}
          {activeTab === 'users' && <UserManagement />}
        </motion.div>
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
