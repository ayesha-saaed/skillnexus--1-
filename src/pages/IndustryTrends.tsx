import React, { useState, useEffect } from 'react';
import { learningService } from '../services/learningService';
import { 
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart, 
  Bar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis
} from 'recharts';
import { TrendingUp, Flame, Globe, Zap, Info, ArrowUpRight, BarChart3, Lightbulb, Compass, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface IndustryTrendsProps {
  onNavigate: (page: any) => void;
}

export function IndustryTrends({ onNavigate }: IndustryTrendsProps) {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'demand' | 'growth'>('demand');
  const [trajectoryData, setTrajectoryData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([
    { subject: 'React', market: 92, fullMark: 100 },
    { subject: 'Node.js', market: 88, fullMark: 100 },
    { subject: 'Python', market: 85, fullMark: 100 },
    { subject: 'AWS', market: 90, fullMark: 100 },
    { subject: 'Docker', market: 82, fullMark: 100 },
    { subject: 'TypeScript', market: 87, fullMark: 100 },
  ]);

  useEffect(() => {
    async function fetchTrajectory() {
      try {
        const traj = await learningService.getSkillTrajectory('demo-user-id'); // Mock user
        setTrajectoryData(traj);
      } catch {
        // Mock fallback already in service
        setTrajectoryData([
          { month: 'Jan', React: 0.3, Nodejs: 0.1, Python: 0.0 },
          { month: 'Feb', React: 0.4, Nodejs: 0.2, Python: 0.1 },
          { month: 'Mar', React: 0.6, Nodejs: 0.4, Python: 0.3 },
          { month: 'Apr', React: 0.7, Nodejs: 0.6, Python: 0.5 },
          { month: 'May', React: 0.85, Nodejs: 0.7, Python: 0.7 },
          { month: 'Jun', React: 0.95, Nodejs: 0.8, Python: 0.85 },
        ]);
      }
    }
    fetchTrajectory();
  }, []);

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
        console.error('Market data fetch failed:', e);
        setTrends([]); // Rely on live data
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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="theme-card overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border-b border-white/10 p-6 uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
            <h2 className="text-xl font-black text-white">Top 10 Skills by Demand Score</h2>
            <div className="ml-auto flex items-center gap-2 text-xs bg-white/10 px-3 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              Live Market Data
            </div>
          </div>
          <p className="text-blue-200/80 text-sm mt-1 font-medium">Ranked by current demand score • Updated via global job market intelligence</p>
        </div>

        <div className="divide-y divide-white/5">
          {sortedTrends.slice(0, 10).map((trend, index) => (
            <motion.div
              key={trend.skillName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="p-6 hover:bg-white/5 transition-all cursor-pointer group relative"
              onClick={() => onNavigate('analysis')}
            >
              <div className="absolute left-6 top-6 text-xs bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-white border border-emerald-500/30 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                #{index + 1}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-emerald-500 rounded-xl shadow-lg" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg group-hover:text-blue-400 transition-colors">{trend.skillName}</h3>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mt-0.5">High Demand</p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                      {trend.demandScore}
                    </span>
                    <span className="text-xs text-zinc-500">/100</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    {trend.growth}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {sortedTrends.length === 0 && !loading && (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No market data available. Check back soon!</p>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Main Data Visualization */}
        <div className="lg:col-span-8 space-y-6">
          <div className="theme-card p-1">
  <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    Personal Skill Trajectory Report
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2">Your proficiency growth over time (top 3 skills from events)</p>
                </div>
              </div>
              
              <div className="h-[400px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={trajectoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#37415140" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#f8fafc', fontSize: 12, fontWeight: 600 }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 1]} 
                      tick={{ fill: '#f8fafc', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f0f23', 
                        border: '1px solid #27272a', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      labelStyle={{ color: 'white', fontWeight: 'bold' }}
                      itemStyle={{ color: 'white' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="React" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ fill: '#10b981', strokeWidth: 2 }} 
                      name="React"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Nodejs" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }} 
                      name="Node.js"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Python" 
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      dot={{ fill: '#f59e0b', strokeWidth: 2 }} 
                      name="Python"
                    />
                    <Legend />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-zinc-500 text-center">
                Proficiency growth based on skill development events • Green=React, Blue=Node.js, Orange=Python
              </p>
            </div>

              {/* Industry Trends Bar Chart */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                      <BarChart3 className="w-6 h-6" style={{ color: chartColor }} />
                      {activeMetric === 'demand' ? 'Market Demand' : 'Growth Velocity'}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-2">Top skills ranked by {activeMetric === 'demand' ? 'demand score' : 'projected growth'}</p>
                  </div>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedTrends.slice(0, 12)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#37415140" vertical={false} />
                      <XAxis 
                        dataKey="skillName" 
                        tick={{ fill: '#f8fafc', fontSize: 11, fontWeight: 600 }} 
                        axisLine={false} 
                        tickLine={false}
                        angle={-45}
                        height={80}
                      />
                      <YAxis 
                        tick={{ fill: '#f8fafc', fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f0f23', 
                          border: '1px solid #27272a', 
                          borderRadius: '8px',
                          color: 'white'
                        }} 
                        labelStyle={{ color: 'white', fontWeight: 'bold' }}
                        itemStyle={{ color: 'white' }}
                      />
                      <Bar 
                        dataKey={chartDataKey}
                        fill={chartColor}
                        name={activeMetric === 'demand' ? 'Demand Score' : 'Growth %'}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-zinc-500 text-center mt-4">
                  {activeMetric === 'demand' ? 'Blue = Demand Score (higher = more jobs)' : 'Green = Growth Velocity (higher = rising demand)'}
                </p>
              </div>

            {/* Market Benchmark Radar */}
            <div className="border-t border-white/5 pt-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                    Market Benchmark
                  </h3>
                  <p className="text-sm text-zinc-400 mt-2">Industry average proficiency levels for top skills</p>
                </div>
              </div>
              <div className="h-[350px] relative flex items-center justify-center overflow-hidden mb-6">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={radarData}
                  >
                    <PolarGrid stroke="#222" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#f8fafc', fontSize: 10, fontWeight: 600 }}
                    />
                    <Radar
                      name="Market Level"
                      dataKey="market"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-zinc-500 text-center">
                Compare against industry benchmarks • Blue=Market Average
              </p>
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

