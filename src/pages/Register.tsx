import React, { useState } from 'react';
import { supabase } from '../lib/firebase';
import { motion } from 'motion/react';
import { Mail, Lock, User, AlertCircle, Chrome } from 'lucide-react';

interface RegisterProps {
  onNavigate: (page: any) => void;
}

export function Register({ onNavigate }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSocialLogin = async (providerName: 'google') => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerName,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Failed to sign up with ${providerName}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (userId) {
        await supabase.from('profiles').upsert({
          id: userId,
          name,
          email,
          role: 'student',
          points: 0,
          level: 1,
          badges: [],
          created_at: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] p-4 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full theme-card bg-[var(--color-bg-card)]/80 backdrop-blur-xl p-6 sm:p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <img src="/favicon.svg" alt="Skill Nexus logo" className="w-14 h-14 mx-auto mb-6" />
          <h1 className="text-xl font-bold text-white uppercase tracking-[0.2em]">Register</h1>
          <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest font-bold">Join the SkillNexus community</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              <Chrome className="w-4 h-4 text-blue-400" />
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your name"
                  className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                  className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 text-rose-400 bg-rose-500/5 p-4 rounded-xl text-[11px] border border-rose-500/10 transition-all font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase text-xs tracking-widest mt-4"
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-4">Already have an account?</p>
          <button 
            onClick={() => onNavigate('login')}
            className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Login Here
          </button>
        </div>
      </motion.div>
    </div>
  );
}

