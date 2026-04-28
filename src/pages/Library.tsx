import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, getDocs, addDoc, where, serverTimestamp, doc, getDoc, limit } from 'firebase/firestore';
import { 
  Book, CheckCircle, ExternalLink, GraduationCap, PlayCircle, Search, 
  Sparkles, ShieldAlert, Plus, Filter, Trophy, Zap, Clock, Star, 
  AlertCircle, Code2, ShieldCheck, BarChart3, Cloud, Lock, Smartphone, 
  Palette, ChevronRight, Layers, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { learningService, Progress } from '../services/learningService';
import { gamificationService } from '../services/gamificationService';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  skillsCovered: string[];
  difficulty: string;
  platform: string;
  duration?: string;
  rating?: number;
}

interface LibraryProps {
  onNavigate: (page: any) => void;
}

export function Library({ onNavigate }: LibraryProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterDomain, setFilterDomain] = useState('All');
  const [showOnlyMySkills, setShowOnlyMySkills] = useState(false);
  const [showOnlyGaps, setShowOnlyGaps] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const DOMAINS = [
    { name: 'Full Stack', icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-500/20' },
    { name: 'Frontend', icon: Code2, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/20' },
    { name: 'Backend', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' },
    { name: 'AI / Machine Learning', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/20' },
    { name: 'Data Science', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/20' },
    { name: 'DevOps', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-500/20' },
    { name: 'Cloud Computing', icon: Cloud, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-500/20' },
    { name: 'Cybersecurity', icon: Lock, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/20' },
    { name: 'Mobile Development', icon: Smartphone, color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-500/20' },
    { name: 'UI/UX Design', icon: Palette, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-500/20' }
  ];

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch user skills for filtering
      const skillsSnap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'skills'));
      const skillsList = skillsSnap.docs.map(doc => doc.data().skillName);
      setUserSkills(skillsList);

      const resSnap = await getDocs(collection(db, 'resources'));
      const resData = resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      setResources(resData);

      const progData = await learningService.getUserProgress(auth.currentUser.uid);
      const progMap: Record<string, Progress> = {};
      progData.forEach((p: any) => {
        progMap[p.resourceId] = p;
      });
      setProgress(progMap);
    } catch (e: any) {
      console.error("Library load error:", e);
      setError(e.message || "Failed to load curriculum data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Could not load curriculum');
      await fetchData();
      if (auth.currentUser) {
        await gamificationService.awardPoints(auth.currentUser.uid, 100, 'Curriculum Synchronization');
        await gamificationService.awardBadge(auth.currentUser.uid, 'nexus_pioneer');
      }
      alert('Knowledge clusters synchronized successfully! +100 IQ awarded.');
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Synchronization failed');
    } finally {
      setSeeding(false);
    }
  }

  async function handleUpdateProgress(resourceId: string, status: Progress['status'], incProgress: number) {
    if (!auth.currentUser) return;
    try {
      const isNewlyCompleted = status === 'Completed' && progress[resourceId]?.status !== 'Completed';
      
      await learningService.updateProgress(auth.currentUser.uid, resourceId, {
        status,
        progress: incProgress,
        timeSpent: 1 // Increment by 1 hour for demo
      });

      if (isNewlyCompleted) {
        await gamificationService.awardPoints(auth.currentUser.uid, 50, 'Module Completion');
        // Check for Module Master badge
        const completedCount = Object.values(progress).filter(p => p.status === 'Completed').length + 1;
        if (completedCount >= 5) {
          await gamificationService.awardBadge(auth.currentUser.uid, 'module_master');
        }
      }

      const updatedProg = await learningService.getUserProgress(auth.currentUser.uid);
      const progMap: Record<string, Progress> = {};
      updatedProg.forEach((p: any) => {
        progMap[p.resourceId] = p;
      });
      setProgress(progMap);
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = resources.filter(r => {
    const searchLower = search.toLowerCase();
    const matchesSearch = r.title?.toLowerCase().includes(searchLower) || 
                         r.skillsCovered?.some(s => s.toLowerCase().includes(searchLower)) ||
                         r.description?.toLowerCase().includes(searchLower);
    const matchesType = filterType === 'All' || r.type === filterType;
    const matchesDiff = filterDifficulty === 'All' || r.difficulty === filterDifficulty;
    
    // Strict Domain match logic
    const resourceDomain = (r as any).domain;
    const matchesDomain = filterDomain === 'All' || resourceDomain === filterDomain;

    // Intelligence Filters
    const matchesMySkills = !showOnlyMySkills || r.skillsCovered?.some(s => userSkills.includes(s));
    const matchesGaps = !showOnlyGaps || r.skillsCovered?.some(s => !userSkills.includes(s));

    return matchesSearch && matchesType && matchesDiff && matchesDomain && matchesMySkills && matchesGaps;
  });

  const recommended = resources.filter(r => {
    // Recommendation logic: if it matches user skills or identified gaps
    return r.skillsCovered?.some(s => userSkills.includes(s)) || (r.rating && r.rating >= 4.9);
  }).slice(0, 3);

  if (loading && !seeding) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Syncing Knowledge Base...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-12 theme-card border-rose-500/20 bg-rose-500/5 max-w-2xl mx-auto">
      <ShieldAlert className="w-12 h-12 text-rose-500 mb-6 opacity-30" />
      <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Protocol Interrupted</h2>
      <p className="text-xs text-zinc-600 uppercase font-bold tracking-widest mb-8 text-center">{error}</p>
      <button 
        onClick={() => fetchData()}
        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all"
      >
        Retry Synchronization
      </button>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      {/* Header section with seeding option */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 w-fit">
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Intelligence Matrix V2</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter sm:text-7xl leading-none">Resource<br/>Library<span className="text-blue-500">.</span></h1>
          <p className="text-sm text-zinc-500 max-w-xl font-medium leading-relaxed">
            Curated industrial-grade learning units dynamically indexed to bridge your identified knowledge gaps and master high-demand career vectors.
          </p>
        </div>
        
        {resources.length === 0 && !loading && (
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-3 bg-white text-black hover:bg-zinc-200 px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-500/10 disabled:opacity-50 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? 'Calibrating...' : 'Sync Intelligence'}
          </button>
        )}
      </div>

      {/* Recommendations Bar */}
      {recommended.length > 0 && !search && (
        <div className="space-y-6">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Priority Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommended.map(res => (
              <div key={`rec-${res.id}`} className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 relative group overflow-hidden">
                <div className="flex items-center gap-2 text-amber-500 text-[9px] font-bold uppercase tracking-widest mb-3">
                   <Star className="w-3 h-3 fill-amber-500" /> Skill Match Found
                </div>
                <h3 className="text-sm font-bold text-white mb-2 leading-tight">{res.title}</h3>
                <div className="flex flex-wrap gap-1 mb-4">
                  {res.skillsCovered.map(s => (
                    <span key={s} className="text-[7px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded uppercase font-black">{s}</span>
                  ))}
                </div>
                <button 
                  onClick={() => window.open(res.url, '_blank')}
                  className="w-full bg-white/5 hover:bg-white/10 text-white text-[9px] font-bold uppercase tracking-[0.15em] py-3 rounded-lg border border-white/10 transition-all font-mono"
                >
                  Start Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain intelligence Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
             <LayoutGrid className="w-4 h-4 text-blue-500" /> Career Domains
           </h2>
           <button 
             onClick={() => setFilterDomain('All')}
             className={`text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 ${filterDomain === 'All' ? 'text-blue-500' : 'text-zinc-600'}`}
           >
             Show All Clusters <ChevronRight className="w-2.5 h-2.5" />
           </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
           {DOMAINS.map(domain => {
             const IsActive = filterDomain === domain.name;
             const domainResourcesCount = resources.filter(r => (r as any).domain === domain.name).length;
             
             return (
               <button
                 key={domain.name}
                 onClick={() => setFilterDomain(IsActive ? 'All' : domain.name)}
                 className={`p-5 rounded-3xl border text-left transition-all relative group overflow-hidden h-full flex flex-col justify-between ${IsActive ? `${domain.bg} ${domain.border} shadow-2xl shadow-zinc-950` : 'bg-zinc-900/40 border-white/5 hover:border-white/10'}`}
               >
                 <div className={`p-3 rounded-2xl inline-flex mb-4 transition-transform group-hover:scale-110 ${domain.bg} ${domain.color}`}>
                   <domain.icon className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-xs font-black text-white mb-1 uppercase tracking-tighter leading-none">{domain.name}</p>
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{domainResourcesCount} Units Available</p>
                 </div>
                 {IsActive && (
                   <motion.div 
                     layoutId="active-domain"
                     className="absolute inset-0 border-2 border-blue-500 rounded-3xl pointer-events-none"
                   />
                 )}
               </button>
             );
           })}
        </div>
      </div>
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-all" />
                    <input 
                      type="text" 
                      placeholder="Search knowledge clusters..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-zinc-900 border border-white/5 rounded-3xl outline-none focus:border-blue-500/50 focus:bg-zinc-800/80 transition-all text-sm text-white placeholder:text-zinc-600 font-medium"
                    />
                  </div>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-8 py-5 rounded-3xl border transition-all flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest ${showFilters ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                  >
                    <Filter className="w-4 h-4" /> Smart Filters
                  </button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }} 
                      className="overflow-hidden"
                    >
                      <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 mt-2">
                         <div className="space-y-4">
                           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-1">
                             <Layers className="w-3.5 h-3.5" /> Content Framework
                           </label>
                           <div className="flex flex-wrap gap-2">
                             {['All', 'Course', 'Video', 'Article'].map(t => (
                               <button 
                                 key={t} 
                                 onClick={() => setFilterType(t)} 
                                 className={`px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${filterType === t ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
                               >
                                 {t}
                               </button>
                             ))}
                           </div>
                         </div>

                         <div className="space-y-4">
                           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-1">
                             <Sparkles className="w-3.5 h-3.5" /> Intelligence Targeting
                           </label>
                           <div className="flex flex-wrap gap-2">
                             <button 
                                onClick={() => setShowOnlyMySkills(!showOnlyMySkills)}
                                className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${showOnlyMySkills ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
                              >
                                {showOnlyMySkills ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} Own Knowledge
                              </button>
                              <button 
                                onClick={() => setShowOnlyGaps(!showOnlyGaps)}
                                className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${showOnlyGaps ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
                              >
                                {showOnlyGaps ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} Identified Gaps
                              </button>
                           </div>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

      {/* Resources Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((res, i) => {
              const userProg = progress[res.id];
              const isStarted = !!userProg;
              const isCompleted = userProg?.status === 'Completed';
              const resourceDomain = DOMAINS.find(d => d.name === (res as any).domain);

              return (
                <motion.div 
                  key={res.id}
                  layout 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="theme-card group hover:border-blue-500/30 flex flex-col h-full bg-zinc-900/40 relative"
                >
                  {/* Card Header Illustration / Icon */}
                  <div className={`h-1.5 w-full absolute top-0 left-0 ${resourceDomain?.bg || 'bg-zinc-800'} ${resourceDomain?.color || ''}`}></div>
                  
                  <div className="p-8 pb-4 flex flex-col h-full mt-2">
                    <div className="flex items-start justify-between mb-8">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : (isStarted ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-black/40 border-white/5 text-zinc-500')}`}>
                        {res.type === 'Video' ? <PlayCircle className="w-6 h-6" /> : (res.type === 'Article' ? <Book className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />)}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/5 rounded-full">
                           <div className={`w-1.5 h-1.5 rounded-full ${res.difficulty === 'Beginner' ? 'bg-emerald-500' : (res.difficulty === 'Intermediate' ? 'bg-amber-500' : 'bg-rose-500')}`}></div>
                           <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{res.difficulty}</span>
                        </div>
                        {(res.rating || 0) >= 4.8 && (
                          <div className="flex items-center gap-1 text-amber-500">
                             <Trophy className="w-3 h-3" /> <span className="text-[9px] font-black uppercase">Top Rated</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${resourceDomain?.color || 'text-zinc-500'}`}>
                            {resourceDomain?.name || 'General Cluster'}
                          </span>
                          <span className="text-zinc-700 font-black">•</span>
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{res.platform}</span>
                        </div>
                        <h3 className="text-lg font-black text-white mb-2 leading-tight tracking-tight group-hover:text-blue-400 transition-colors">{res.title}</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 font-medium">{res.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {res.skillsCovered?.map(s => (
                          <span key={`pill-${s}`} className="text-[8px] font-black text-zinc-400 uppercase tracking-widest px-2.5 py-1 bg-white/5 border border-white/5 rounded-md hover:bg-white/10 transition-colors cursor-default">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Technical Metadata */}
                    <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 mb-6">
                       <div className="space-y-1">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> Runtime
                          </p>
                          <p className="text-[10px] font-bold text-zinc-300 uppercase">{res.duration || 'Variable'}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                            <Zap className="w-3 h-3" /> Demand Level
                          </p>
                          <div className="flex gap-0.5">
                             {[1, 2, 3, 4, 5].map(b => (
                               <div key={b} className={`h-1 flex-1 rounded-full ${b <= 4 ? 'bg-blue-500' : 'bg-white/10'}`}></div>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Activity Logic */}
                    <div className="mt-auto pt-6 space-y-6">
                       <div className="space-y-2.5">
                          <div className="flex justify-between items-end">
                             <div>
                                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{userProg?.status || 'Deployment Ready'}</p>
                             </div>
                             <p className="text-[10px] font-black text-zinc-500 font-mono tracking-tighter">{userProg?.progress || 0}% Complete</p>
                          </div>
                          <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                             <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${userProg?.progress || 0}%` }} 
                                className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]'}`} 
                             />
                          </div>
                       </div>

                       <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              window.open(res.url, '_blank');
                              handleUpdateProgress(res.id, 'In Progress', (userProg?.progress || 0) + 15 > 100 ? 100 : (userProg?.progress || 0) + 15);
                            }}
                            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${isCompleted ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10' : 'bg-white text-black hover:bg-zinc-200'}`}
                          >
                            {isCompleted ? 'Relaunch' : (isStarted ? 'Resume Protocol' : 'Deploy Module')}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          
                          {!isCompleted && (
                            <button 
                              onClick={() => handleUpdateProgress(res.id, 'Completed', 100)}
                              className={`p-4 rounded-2xl border transition-all ${isStarted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500' : 'bg-white/5 border-white/5 text-zinc-700 opacity-20 cursor-not-allowed hover:opacity-100 hover:text-white'}`}
                              title="Commit to Registry"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="theme-card min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 bg-zinc-900/20 border-dashed border-white/10">
          <Book className="w-12 h-12 text-zinc-700 animate-pulse" />
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-widest">Knowledge Stream Halted</h3>
            <p className="text-[11px] text-zinc-600 uppercase font-bold tracking-widest mt-2">
              {search ? 'Nothing found across intelligence clusters' : (filterDomain !== 'All' ? `No specialized units found for ${filterDomain} yet` : 'Intelligence base is offline')}
            </p>
          </div>
          {search || filterDomain !== 'All' ? (
            <button 
              onClick={() => { setSearch(''); setFilterType('All'); setFilterDifficulty('All'); setFilterDomain('All'); }}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-blue-400 hover:text-white transition-all uppercase tracking-widest"
            >
              Reset All Filters
            </button>
          ) : (
             <button 
              onClick={handleSeed}
              disabled={seeding}
              className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20"
            >
              {seeding ? 'Processing...' : 'Load Curated Curriculum'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
