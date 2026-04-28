import React, { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../lib/firebase';
import { motion } from 'motion/react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import {
  BarChart3,
  Target,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Search,
  Lightbulb,
  ShieldCheck,
  Code2,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SkillAnalysisProps {
  onNavigate: (page: any) => void;
}

interface UserSkill {
  id?: string;
  skillName: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface JobRole {
  id?: string;
  roleName: string;
  requiredSkills: (string | { name: string })[];
  difficulty: string;
  domain: string;
}

function roleRequiredSkillNames(skills: (string | { name: string })[] | undefined): string[] {
  return (skills || []).map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean) as string[];
}

const proficiencyMap: Record<string, number> = {
  Beginner: 30,
  Intermediate: 70,
  Advanced: 100,
};

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#f43f5e', '#84cc16'];

export function SkillAnalysis({ onNavigate }: SkillAnalysisProps) {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [careerSummary, setCareerSummary] = useState('');
  const [analysisRequested, setAnalysisRequested] = useState(false);

  const openRoleResources = () => {
    if (!selectedRole) return;
    const roleSkills = roleRequiredSkillNames(selectedRole.requiredSkills);
    const missing = (analysis?.missingSkills || []).filter((s: string) => !!s);
    localStorage.setItem('library.preferredDomain', selectedRole.domain || 'All');
    localStorage.setItem('library.preferredRole', selectedRole.roleName || '');
    localStorage.setItem('library.preferredMissingSkills', JSON.stringify(missing));
    localStorage.setItem('library.preferredRoleSkills', JSON.stringify(roleSkills));
    onNavigate('library');
  };

  useEffect(() => {
    async function fetchData() {
      const user = await getCurrentUser();
      if (!user) return;
      setCurrentUserId(user.id);
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          throw new Error('Not authenticated');
        }
        const [skillsRes, rolesResponse] = await Promise.all([
          supabase.from('user_skills').select('*').eq('user_id', user.id),
          fetch('/api/job-roles', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (skillsRes.error) throw skillsRes.error;
        if (!rolesResponse.ok) throw new Error(`Failed to load roles: ${rolesResponse.status}`);
        const rolesJson = await rolesResponse.json();

        const skillsData = (skillsRes.data || []).map((d: any) => ({ id: d.id, skillName: d.skill_name, proficiency: d.proficiency } as UserSkill));
        const rolesData = (rolesJson || []).map((d: any) => ({
          id: d.id,
          roleName: d.role_name,
          requiredSkills: d.required_skills || [],
          difficulty: d.difficulty,
          domain: d.domain
        } as JobRole));

        setSkills(skillsData);
        setRoles(rolesData);

        // Auto-select first role
        if (rolesData.length > 0 && !selectedRole) {
          setSelectedRole(rolesData[0]);
        }
      } catch (err) {
        console.error('SkillAnalysis fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    setAnalysisRequested(false);
  }, [selectedRole?.id, careerSummary, skills.length]);

  const runAnalysis = async () => {
    if (!selectedRole || !currentUserId) return;
    setAnalyzing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobRoleId: selectedRole.id,
          userSkills: skills.map((s) => ({
            skillName: s.skillName,
            proficiency: s.proficiency,
          })),
          careerSummary: careerSummary.trim().length >= 10 ? careerSummary.trim() : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.status}`);
      }
      const result = await response.json();
      const requiredNames = roleRequiredSkillNames(selectedRole.requiredSkills);
      const gapData = requiredNames.map((skill) => {
        const userSkill = skills.find((s) => s.skillName.toLowerCase() === skill.toLowerCase());
        return {
          skill,
          userLevel: userSkill ? proficiencyMap[userSkill.proficiency] : 0,
          requiredLevel: 80,
          gap: userSkill ? Math.max(0, 80 - proficiencyMap[userSkill.proficiency]) : 80,
        };
      });
      setAnalysis({
        ...result,
        gapData,
        totalRequired: requiredNames.length,
      });
      setAnalysisRequested(true);
    } catch (err) {
      console.error('Skill analysis API error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Analyzing Skill Matrix...</p>
      </div>
    );
  }

  const radarData = skills.map(s => ({
    subject: s.skillName,
    A: proficiencyMap[s.proficiency] || 0,
    fullMark: 100,
  }));

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Intelligence Analysis</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter sm:text-5xl">Skill Gap Analysis</h1>
          <p className="text-sm text-zinc-500 max-w-xl font-medium leading-relaxed">
            Compare your current skill inventory against industry role requirements to identify precise development targets.
          </p>
        </div>
        <button
          onClick={() => onNavigate('add-skill')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 w-fit shadow-lg shadow-blue-500/20"
        >
          Update Skills <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-[11px] text-zinc-300 leading-relaxed">
        <span className="font-bold text-blue-400 uppercase tracking-widest text-[10px]">Auto analysis </span>
        Gap scores use your saved skills from <span className="text-white font-semibold">My Skills</span> as soon as you pick a role. Optional career text below only refines inferred skills—it is not required.
      </div>

      <div className="theme-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Optional career context</h2>
          {analyzing && <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Analyzing...</span>}
        </div>
        <textarea
          value={careerSummary}
          onChange={(e) => setCareerSummary(e.target.value)}
          placeholder="Optional: projects, tools, seniority, domains. Example: Junior frontend dev; React dashboards; learning TypeScript and testing."
          className="h-28 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-500 focus:border-blue-500"
        />
        <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
          When this is at least 10 characters, we infer extra skills and merge them with your profile (max combined accuracy).
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={runAnalysis}
            disabled={!selectedRole || analyzing}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Gap
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Role Selector */}
      {roles.length > 0 && (
        <div className="theme-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Job role selector</h2>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">
                Choose your target role to compare required skills and get next-step guidance.
              </p>
            </div>
            {selectedRole && (
              <button
                type="button"
                onClick={openRoleResources}
                className="rounded-lg border border-blue-500/30 bg-blue-600/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-200 hover:bg-blue-600/30"
              >
                Role resources
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                  selectedRole?.id === role.id
                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-white/5 text-zinc-400 border-white/5 hover:text-white hover:border-white/10"
                )}
              >
                {role.roleName}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRole && analysis && analysisRequested && (
        <>
          {(analysis.recommendations?.length > 0 || analysis.missingSkills?.length > 0) && (
            <div className="theme-card border-amber-500/20 bg-amber-500/3">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Suggested next steps
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-[11px] text-zinc-300">
                {(analysis.recommendations || []).slice(0, 4).map((line: string, i: number) => (
                  <li key={i} className="pl-1">{line}</li>
                ))}
                {(!analysis.recommendations || analysis.recommendations.length === 0) && (analysis.missingSkills || []).slice(0, 3).map((sk: string) => (
                  <li key={sk} className="pl-1">
                    Close the gap on <span className="font-semibold text-white">{sk}</span>—add it in My Skills or open the Library for a course.
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('add-skill')}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10"
                >
                  Update skills
                </button>
                <button
                  type="button"
                  onClick={openRoleResources}
                  className="rounded-lg border border-blue-500/30 bg-blue-600/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-200 hover:bg-blue-600/30"
                >
                  Role-matched library
                </button>
              </div>
            </div>
          )}
          {analysis.inferredSkills?.length > 0 && (
            <div className="theme-card">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Inferred from your career summary</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.inferredSkills.map((s: any) => (
                  <span key={s.skillName} className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                    {s.skillName} ({Math.round((s.proficiencyLevel || 0.6) * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Match Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="theme-card relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 opacity-5">
                <Target className="w-16 h-16 text-white" />
              </div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Skill Match Score</p>
              <div className="flex items-baseline gap-3">
                <span className={cn(
                  "text-4xl font-black",
                  analysis.skillMatchScore >= 80 ? "text-emerald-400" : analysis.skillMatchScore >= 50 ? "text-amber-400" : "text-rose-400"
                )}>
                  {analysis.skillMatchScore}%
                </span>
              </div>
              <div className="mt-4 theme-progress-bar">
                <motion.div
                  className={cn(
                    "theme-progress-fill",
                    analysis.skillMatchScore >= 80 ? "bg-emerald-500" : analysis.skillMatchScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.skillMatchScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-3 font-medium">
                {analysis.skillMatchScore >= 80 ? 'Strong candidate profile' : analysis.skillMatchScore >= 50 ? 'Moderate alignment - gaps identified' : 'Significant skill gaps detected'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="theme-card"
            >
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Weak Skills</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-amber-400">{analysis.weakSkills?.length || 0}</span>
                <span className="text-[10px] text-zinc-500 uppercase">of {analysis.totalRequired}</span>
              </div>
              <div className="mt-4 space-y-2">
                {(analysis.weakSkills || []).slice(0, 3).map((ws: any) => (
                  <div key={ws.skill} className="rounded-lg border border-white/10 p-2">
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-zinc-200">{ws.skill}</span>
                      <span className={cn(
                        "rounded px-1.5 py-0.5 font-bold uppercase",
                        ws.priority === "High" ? "bg-rose-500/20 text-rose-300" :
                        ws.priority === "Medium" ? "bg-amber-500/20 text-amber-300" :
                        "bg-emerald-500/20 text-emerald-300"
                      )}>
                        {ws.priority}
                      </span>
                    </div>
                    <div className="h-1.5 rounded bg-white/10">
                      <div className="h-1.5 rounded bg-amber-400" style={{ width: `${Math.round((ws.userLevel / ws.requiredLevel) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="theme-card"
            >
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Missing Skills</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-rose-400">{analysis.missingSkills?.length || 0}</span>
                <span className="text-[10px] text-zinc-500 uppercase">missing skills</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(analysis.missingSkills || []).slice(0, 4).map((skill: string) => (
                  <span key={skill} className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 uppercase tracking-wider">
                    {skill}
                  </span>
                ))}
                {(analysis.missingSkills || []).length > 4 && (
                  <span className="text-[9px] font-bold text-zinc-500 px-2 py-1">+{(analysis.missingSkills || []).length - 4} more</span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Gap Analysis Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 theme-card">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Skill Gap Visualization
                  </h2>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">Your level vs required threshold</p>
                </div>
              </div>
              <div className="h-[350px] w-full">
                {analysis.gapData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={analysis.gapData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#222" opacity={0.3} />
                      <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                      <YAxis type="category" dataKey="skill" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} width={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        labelStyle={{ color: '#71717a', marginBottom: '8px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Bar dataKey="userLevel" name="Your Level" radius={[0, 4, 4, 0]}>
                        {analysis.gapData.map((_: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                      <Bar dataKey="requiredLevel" name="Required" fill="#ffffff10" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600">
                    <p className="text-[10px] uppercase font-bold tracking-widest">No gap data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {/* User Skills Radar */}
              <div className="theme-card">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Current Arsenal
                </h2>
                <div className="h-[280px] w-full flex items-center justify-center">
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#222" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#555', fontSize: 9, fontWeight: 600 }} />
                        <Radar
                          name="Proficiency"
                          dataKey="A"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-zinc-600 uppercase text-[10px] tracking-widest italic">
                      No skills registered
                    </div>
                  )}
                </div>
              </div>

              {/* Actionable Insights */}
              <div className="theme-card bg-zinc-900 border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recommended Skills to Learn</h3>
                </div>
                <div className="space-y-4">
                  {(analysis.recommendedSkillsToLearn || []).length > 0 ? (
                    (analysis.recommendedSkillsToLearn || []).slice(0, 5).map((skill: string, i: number) => (
                      <div key={skill} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-[10px] font-black">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-zinc-200">{skill}</p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
                            {analysis.weakSkills?.find((w: any) => skill.includes(w.skill))?.priority || "High"} Priority
                          </p>
                        </div>
                        <button
                          onClick={() => onNavigate('library')}
                          className="text-[9px] font-bold text-blue-500 hover:text-white transition-colors uppercase tracking-wider"
                        >
                          Find Resource
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <p className="text-xs font-bold text-emerald-400">All required skills matched! Consider advancing proficiency levels.</p>
                    </div>
                  )}
                </div>

                {(analysis.recommendedSkillsToLearn || []).length > 0 && (
                  <button
                    onClick={openRoleResources}
                    className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Browse Role Learning Resources <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedRole && roles.length === 0 && (
        <div className="theme-card min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
          <Layers className="w-12 h-12 text-zinc-700" />
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-widest">No Job Roles Configured</h3>
            <p className="text-[11px] text-zinc-600 uppercase font-bold tracking-widest mt-2">
              Admin needs to seed job role data for gap analysis
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillAnalysis;

