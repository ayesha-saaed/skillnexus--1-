 import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, supabase } from './lib/firebase';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { SkillAnalysis } from './pages/SkillAnalysis';
import { IndustryTrends } from './pages/IndustryTrends';
import { AddSkill } from './pages/AddSkill';
import { Library } from './pages/Library';
import { Admin } from './pages/Admin';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'login' | 'register' | 'analysis' | 'trends' | 'add-skill' | 'library' | 'admin'>('login');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (u) => {
      try {
        setUser(u);
        if (u) {
          const isAdminEmail = u.email === 'saeedayesha995@gmail.com';
          const profileData = {
            id: u.id,
            name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'New User',
            email: u.email,
            role: isAdminEmail ? 'admin' : 'student',
            points: 0,
            level: 1,
            badges: [],
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });

          if (error) console.warn('Profile upsert:', error.message);

          const { data: profile } = await supabase.from('profiles').select('role').eq('id', u.id).single();
          const role = profile?.role || 'student';
          setUserRole(role);
          setCurrentPage('dashboard');
        } else {
          setUserRole(null);
          setCurrentPage('login');
        }
      } catch (err: any) {
        console.error("Critical Auth/Database Failure:", err.message);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'login': return <Login onNavigate={setCurrentPage} />;
      case 'register': return <Register onNavigate={setCurrentPage} />;
      case 'dashboard': return <Dashboard user={user!} onNavigate={setCurrentPage} />;
case 'analysis': return <SkillAnalysis user={user!} onNavigate={setCurrentPage} />;
      case 'trends': return <IndustryTrends onNavigate={setCurrentPage} />;
      case 'add-skill': return <AddSkill onNavigate={setCurrentPage} user={user!} />;
      case 'library': return <Library onNavigate={setCurrentPage} />;
      case 'admin': return <Admin onNavigate={setCurrentPage} />;
      default: return <Login onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {user && currentPage !== 'login' && currentPage !== 'register' ? (
          <Layout user={user} userRole={userRole} onNavigate={setCurrentPage} currentPage={currentPage}>
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </Layout>
        ) : (
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            {renderPage()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
