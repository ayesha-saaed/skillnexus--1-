import React from 'react';
import { User, signOut, supabase } from '../lib/firebase';
import { LayoutDashboard, BarChart3, LineChart, PlusCircle, LogOut, Code2, Library, ShieldCheck, Zap, Award, Github, Linkedin, Mail, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { SkillAgent } from './SkillAgent';
import { ACTIVE_PATH_EVENT, readActivePathFromStorage } from '../lib/activePath';
import { isAdminRole } from '../lib/inputValidation';
import type { AppPage } from '../lib/navigation';
import type { LucideIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  userRole: string | null;
  onNavigate: (page: AppPage) => void;
  currentPage: AppPage;
}

export function Layout({ children, user, userRole, onNavigate, currentPage }: LayoutProps) {
  const [userData, setUserData] = React.useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [activePathLabel, setActivePathLabel] = React.useState('Set in Gap Checker');

  const refreshActivePathLabel = React.useCallback(() => {
    const ls = readActivePathFromStorage();
    const name = ls.roleName || (userData as any)?.active_job_role_name;
    const domain = ls.domain || (userData as any)?.active_path_domain;
    if (name) {
      setActivePathLabel(domain ? `${name} · ${domain}` : name);
    } else {
      setActivePathLabel('Set in Gap Checker');
    }
  }, [userData]);

  React.useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (!mounted) return;
      if (error) {
        console.error('Layout userData fetch error:', error.message);
        return;
      }
      setUserData(data);
    };
    fetchProfile();
    const timer = setInterval(fetchProfile, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [user.id]);

  React.useEffect(() => {
    refreshActivePathLabel();
  }, [refreshActivePathLabel, currentPage]);

  React.useEffect(() => {
    const onPath = () => refreshActivePathLabel();
    window.addEventListener(ACTIVE_PATH_EVENT, onPath);
    return () => window.removeEventListener(ACTIVE_PATH_EVENT, onPath);
  }, [refreshActivePathLabel]);

  const menuItems: { id: AppPage; label: string; icon: LucideIcon }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-skill', label: 'My Skills', icon: Code2 },
    { id: 'analysis', label: 'Gap Checker', icon: BarChart3 },
    { id: 'library', label: 'Resource Library', icon: Library },
    { id: 'trends', label: 'Market Trends', icon: LineChart },
  ];

  if (isAdminRole(userRole)) {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-main)]">
      {/* Sidebar */}
      <aside className="w-[220px] theme-sidebar flex flex-col hidden md:flex border-r border-white/5">
        <div className="px-8 pt-8 mb-10 flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tighter text-white">
            SkillNexus<span className="text-blue-500">.</span>
          </span>
        </div>
        
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full theme-nav-item",
                currentPage === item.id && "active"
              )}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>

          <div className="p-6 mt-auto">
          <div className="pt-6 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/20"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-[var(--color-text-secondary)] truncate uppercase tracking-tighter">Verified Member</p>
              </div>
            </div>
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-white transition-colors text-xs font-semibold uppercase tracking-widest"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth bg-black/40">
        <header className="h-16 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden">
              <Logo className="w-8 h-8" />
            </div>
            <h1 className="text-sm font-bold text-white uppercase tracking-widest hidden sm:block">
              {menuItems.find(m => m.id === currentPage)?.label || 'Overview'}
            </h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="flex items-center gap-3 sm:gap-4 bg-zinc-900 border border-white/5 rounded-2xl px-3 sm:px-4 py-2">
                <div className="flex flex-col items-end">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Nexus IQ</p>
                    <p className="text-sm font-black text-blue-500 font-mono tracking-tighter leading-none">{userData?.points || 0}</p>
                </div>
                <div className="w-px h-6 bg-white/5 hidden sm:block"></div>
                <div className="hidden sm:flex flex-col">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Level</p>
                    <p className="text-sm font-black text-white leading-none whitespace-nowrap">{userData?.level || 1}</p>
                </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 min-w-0 max-w-[min(22rem,40vw)]">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest shrink-0">Active Path</span>
              <span
                className="text-[10px] font-bold text-white truncate bg-white/5 px-2 py-0.5 rounded border border-white/10"
                title={activePathLabel}
              >
                {activePathLabel}
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in min-h-[calc(100vh-14rem)]">
          {children}
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/5 bg-zinc-950/50 pt-12 sm:pt-16 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
              <div className="sm:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                  <Logo className="w-8 h-8" />
                  <span className="text-2xl font-black tracking-tighter text-white">SkillNexus</span>
                </div>
                <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
                  Empowering the next generation of builders through data-driven career analysis and curated learning pathways. Join thousands of developers bridging their gaps today.
                </p>
                <div className="flex gap-4">
                  <a href="https://github.com/ayesha-saaed" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-blue-500 transition-colors"><Github className="w-4 h-4" /></a>
                  <a href="https://www.linkedin.com/in/ayesha-saeed07?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-blue-500 transition-colors"><Linkedin className="w-4 h-4" /></a>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Platform</h4>
                <div className="flex flex-col gap-2">
                  {menuItems.map(item => (
                    <button key={item.id} onClick={() => { onNavigate(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs text-zinc-500 hover:text-white transition-colors text-left font-medium">{item.label}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Connect</h4>
                <div className="flex flex-col gap-2 text-xs text-zinc-500 font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('support');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white flex items-center gap-2 text-left"
                  >
                    <Mail className="w-3.5 h-3.5" /> Support
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('api-reference');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white text-left"
                  >
                    API Reference
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('community');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white text-left"
                  >
                    Community
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              <p>© 2026 SkillNexus AI. All systems operational.</p>
              <div className="flex gap-8">
                <a href="#" className="hover:text-zinc-400">Privacy Protocol</a>
                <a href="#" className="hover:text-zinc-400">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[260px] bg-[var(--color-bg-sidebar)] border-r border-white/5 flex flex-col p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <Logo className="w-8 h-8" />
                <span className="text-xl font-bold tracking-tighter text-white">
                  SkillNexus<span className="text-blue-500">.</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full theme-nav-item",
                    currentPage === item.id && "active"
                  )}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="pt-6 border-t border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/20"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)] truncate uppercase tracking-tighter">Verified Member</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-white transition-colors text-xs font-semibold uppercase tracking-widest"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <SkillAgent user={user} />
    </div>
  );
}
