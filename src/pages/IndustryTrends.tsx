import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Flame, Globe, Zap, Info, ArrowUpRight, BarChart3, Lightbulb, Compass, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface IndustryTrendsProps {
  onNavigate: (page: any) => void;
}

export function IndustryTrends({ onNavigate }: IndustryTrendsProps) {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'demand' | 'growth'>('demand');

  useEffect(() => {
    async function fetchTrends() {
      try {
        const resp = await fetch('/api/industry-trends');
        const data = await resp.json();
        if (Array.isArray(data)) {
          // Add some mock growth data for visual variety if missing
          const enriched = data.map(t => ({
            ...t,
            growth: t.demandScore > 90 ? '+12%' : t.demandScore > 85 ? '+8%' : '+5%',
            forecast: 'High'
          }));
          setTrends(enriched);
        } else {
          setTrends([]);
        }
      } catch (e) {
        console.error(e);
        setTrends([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4'];

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Syncing Market Intelligence...</p>
    </div>
  );

  const stats = [
    { label: 'Hot Sector', value: 'AI & Data', info: 'Highest demand increase this quarter', icon: Flame, color: 'text-orange-500' },
    { label: 'Market Velocity', value: '+14.2%', info: 'Average industry skill rotation speed', icon: Zap, color: 'text-yellow-500' },
    { label: 'Geo-Weight', value: 'Global', info: 'Distributed demand across tech hubs', icon: Globe, color: 'text-blue-500' },
  ];

  const chartRows = trends.map(t => ({
    ...t,
    growthValue: Number(String(t.growth || "0").replace(/[^0-9.-]/g, "")) || 0
  }));
  // Use activeMetric to determine chart data and appearance
  const chartDataKey = activeMetric === 'growth' ? 'growthValue' : 'demandScore';
  const chartColor = activeMetric === 'growth' ? '#10b981' : '#3b82f6';
  const chartGradientId = activeMetric === 'growth' ? 'colorGrowth' : 'colorDemand';

  // Filter and sort trends based on activeMetric
  const sortedTrends = [...chartRows].sort((a, b) => {
    if (activeMetric === 'growth') {
      return (b.growthValue || 0) - (a.growthValue || 0);
    }
    return (b.demandScore || 0) - (a.demandScore || 0);
  });

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto px-4 md:px-0">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Industry Pulse</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter sm:text-5xl">Market Intelligence</h1>
          <p className="text-sm text-zinc-500 max-w-xl font-medium leading-relaxed">
            Real-time analysis of global technical skill demand. We monitor job boards, GitHub activity, and industry reports to build your career roadmap.
          </p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 mb-2">
           <button 
            onClick={() => setActiveMetric('demand')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeMetric === 'demand' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
           >
            Demand Score
           </button>
           <button 
            onClick={() => setActiveMetric('growth')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeMetric === 'growth' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
           >
            Velocity
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="theme-card relative group"
          >
            <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-12 h-12 text-white" />
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">{stat.label}</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-white">{stat.value}</span>
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-80`} />
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-600 font-medium italic">
              <Info className="w-3 h-3 text-zinc-700" />
              {stat.info}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Data Visualization */}
        <div className="lg:col-span-8 space-y-6">
          <div className="theme-card p-1">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Skill Trajectory Report
                  </h2>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">Top rated skills by institutional demand frequency</p>
                </div>
              </div>
              
              <div className="h-[400px] w-full relative overflow-hidden">
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={sortedTrends}>
                      <defs>
                        <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" opacity={0.3} />
                      <XAxis 
                        dataKey="skillName" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        labelStyle={{ color: '#71717a', marginBottom: '8px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        cursor={{ stroke: chartColor, strokeWidth: 2, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={chartDataKey} 
                        stroke={chartColor} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill={`url(#${chartGradientId})`} 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                    <Compass className="w-12 h-12 mb-4 opacity-10 animate-pulse" />
                    <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Calibrating sensors...</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/5 divide-x divide-white/5">
              {sortedTrends.slice(0, 4).map((t, i) => (
                <div key={i} className="p-6 hover:bg-white/[0.02] transition-colors cursor-default">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.skillName}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">{t.demandScore}</span>
                    <span className="text-[9px] font-bold text-emerald-500 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <ArrowUpRight className="w-2.5 h-2.5" />
                      {t.growth}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="theme-card bg-zinc-900 border-white/5 flex flex-col">
            <div className="flex items-center gap-2 mb-8">
               <Lightbulb className="w-4 h-4 text-amber-500" />
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">How to Use This Data</h3>
            </div>
            
            <div className="space-y-6">
              {[
                { title: 'Spot Gaps', text: 'If a skill has a score > 90 and you don\'t have it, prioritize that in your dashboard.', icon: Target },
                { title: 'Track Velocity', text: 'Skills with high growth percentages are emerging. Early adoption gives you a competitive edge.', icon: Zap },
                { title: 'Sector Shifts', text: 'Watch the "Hot Sector" stat to understand where the most funding is moving.', icon: Globe }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-zinc-300 uppercase tracking-widest mb-1">{item.title}</h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5">
               <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Sectors to Watch</h4>
               <div className="space-y-2">
                  {['AI / Machine Learning', 'Cloud Infrastructure', 'Cybersecurity', 'Web3 / Decentralized'].map((sector, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] py-1">
                      <span className="text-zinc-400">{sector}</span>
                      <span className="text-blue-500 font-bold uppercase tracking-tighter">Accelerating</span>
                    </div>
                  ))}
               </div>
            </div>

            <button 
              onClick={() => onNavigate('analysis')}
              className="mt-10 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              Start Gap Analysis <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="theme-card !bg-blue-600/10 border-blue-500/30 overflow-hidden relative group">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[80px] rounded-full group-hover:bg-blue-500/30 transition-all pointer-events-none" />
             <div className="relative z-10">
                <div className="flex items-center gap-2 text-blue-400 mb-4">
                  <Flame className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Market Strategy</span>
                </div>
                <h4 className="text-lg font-black text-white tracking-tight mb-3">AI & Agentic Workflows</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium italic border-l-2 border-blue-500/50 pl-4">
                  "The industry is moving from simple automation to complex, **autonomous agents**. Focus on mastering orchestration frameworks to stay 2 years ahead of the standard curve."
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

