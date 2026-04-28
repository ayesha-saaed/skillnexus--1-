import React, { useState, useEffect } from 'react';
import { gamificationService, BADGES } from '../services/gamificationService';
import { motion } from 'motion/react';
import { Trophy, Shield, Star, Award, Zap, ChevronRight, Crown, Medal } from 'lucide-react';

export function Leaderboard() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLB = async () => {
      const data = await gamificationService.getLeaderboard(20);
      setEntries(data);
      setLoading(false);
    };
    fetchLB();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
            <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20">
                <Trophy className="w-10 h-10 text-amber-500" />
            </div>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter sm:text-6xl uppercase">Hall of Architecture<span className="text-blue-500">.</span></h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Global Nexus IQ Ranking — Real-time Intelligence Velocity</p>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-4">
          {/* Top 3 Spotlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 0, 2].map(idx => {
                const entry = entries[idx];
                if (!entry) return null;
                const isFirst = idx === 0;
                
                return (
                    <motion.div 
                        key={entry.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`theme-card relative flex flex-col items-center p-8 text-center ${isFirst ? 'border-amber-500/40 bg-amber-500/5 ring-2 ring-amber-500/20' : 'bg-zinc-900/40'}`}
                    >
                        {isFirst && <Crown className="absolute -top-6 w-12 h-12 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />}
                        <div className="relative mb-6">
                            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isFirst ? 'border-amber-500' : 'border-zinc-800'}`}>
                                <img src={entry.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${entry.userId}`} alt={entry.displayName} className="w-full h-full object-cover" />
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border-2 ${isFirst ? 'bg-amber-500 border-zinc-900 text-black' : 'bg-zinc-800 border-zinc-900 text-white'}`}>
                                #{idx + 1}
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight leading-none mb-2">{entry.displayName}</h3>
                        <div className="flex items-center gap-2 px-4 py-1 bg-white/5 rounded-full border border-white/10 mb-4">
                            <Zap className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{entry.points} IQ</span>
                        </div>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(entry.badgesCount, 5) }).map((_, i) => (
                                <Award key={i} className="w-4 h-4 text-zinc-600" />
                            ))}
                        </div>
                    </motion.div>
                );
            })}
          </div>

          {/* List View for the rest */}
          <div className="theme-card bg-zinc-950/50 p-0 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-6">Architect</div>
                <div className="col-span-3 text-right">Nexus IQ</div>
                <div className="col-span-2 text-right">Badges</div>
            </div>
            {entries.slice(3).map((entry, i) => (
                <div key={entry.userId} className="grid grid-cols-12 gap-4 p-5 hover:bg-white/5 transition-colors border-b border-white/5 items-center group">
                    <div className="col-span-1 text-center font-black text-lg text-zinc-700 italic group-hover:text-zinc-500 transition-colors">
                        {i + 4}
                    </div>
                    <div className="col-span-6 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                            <img src={entry.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${entry.userId}`} alt={entry.displayName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white tracking-tight uppercase">{entry.displayName}</p>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Active Level {Math.floor(entry.points / 500) + 1}</p>
                        </div>
                    </div>
                    <div className="col-span-3 text-right">
                        <span className="text-sm font-mono font-black text-blue-500 tracking-tighter">{entry.points}</span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                        {Array.from({ length: Math.min(entry.badgesCount, 3) }).map((_, x) => (
                            <Medal key={x} className="w-4 h-4 text-zinc-800" />
                        ))}
                    </div>
                </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="theme-card text-center p-20 space-y-4 bg-zinc-900/20 border-dashed border-white/10">
            <Medal className="w-12 h-12 text-zinc-800 mx-auto opacity-20" />
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Waiting for first achievements...</p>
        </div>
      )}
    </div>
  );
}
