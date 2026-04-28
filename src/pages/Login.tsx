import React, { useState } from 'react';
import { supabase } from '../lib/firebase';
import { motion } from 'motion/react';
import { Mail, Lock, AlertCircle, Chrome } from 'lucide-react';

interface LoginProps {
  onNavigate: (page: 'login' | 'register' | 'dashboard') => void;
}

export function Login({ onNavigate }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Email Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] p-4 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-[var(--color-bg-card)]/80 backdrop-blur-xl p-6 sm:p-10 rounded-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <img src="/favicon.svg" alt="Skill Nexus logo" className="w-14 h-14 mx-auto mb-6" />
          <h1 className="text-xl font-bold text-white uppercase tracking-widest">
            Login
          </h1>
          <p className="text-xs text-zinc-500 mt-2 uppercase tracking-wider">
            Access your account
          </p>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition uppercase tracking-widest disabled:opacity-50"
        >
          <Chrome className="w-4 h-4 text-blue-400" />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 py-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[10px] text-zinc-500 uppercase">OR</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Email Login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition uppercase text-xs tracking-widest disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Register */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500 mb-2">
            Don't have an account?
          </p>
          <button
            onClick={() => onNavigate('register')}
            className="text-xs text-blue-500 font-bold uppercase tracking-widest hover:text-white"
          >
            Create Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
