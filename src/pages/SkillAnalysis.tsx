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
  requiredSkills: string[];
  difficulty: string;
  domain: string;
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
  const [analysis, setAnalysis] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const user = await getCurrentUser();
      if (!user) return;
      setCurrentUserId(user.id);
      setLoading(true);
      try {
        const [skillsRes, rolesRes] = await Promise.all([
          supabase.from('user_skills').select('*').eq('user_id', user.id),
          supabase.from('job_roles').select('*'),
        ]);
        if (skillsRes.error) throw skillsRes.error;
        if (rolesRes.error) throw rolesRes.error;

        const skillsData = (skillsRes.data || []).map((d: any) => ({ id: d.id, skillName: d.skill_name, proficiency: d.proficiency } as UserSkill));
        const rolesData = (rolesRes.data || []).map((d: any) => ({ id: d.id, roleName: d.role_name, requiredSkills: d.required_skills || [], difficulty: d.difficulty, domain: d.domain } as JobRole));

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
    if (!selectedRole || !currentUserId) return;

    const runAnalysis = async () => {
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
            userId: currentUserId,
            jobRoleId: selectedRole.id,
            userSkills: skills
          }),
        });
        if (!response.ok) {
          throw new Error(`Analysis request failed: ${response.status}`);
        }
        const result = await response.json();
        const required = selectedRole.requiredSkills || [];
        const gapData = required.map(skill => {
          const userSkill = skills.find(s => s.skillName.toLowerCase() === skill.toLowerCase());
          return {
            skill,
            userLevel: userSkill ? proficiencyMap[userSkill.proficiency] : 0,
            requiredLevel: 80,
            gap: userSkill ? Math.max(0, 80 - proficiencyMap[userSkill.proficiency]) : 80,
          };
        });
        setAnalysis({
          matchScore: Math.round((result.similarity || 0) * 100),
          matched: result.matched || [],
          missing: result.missing || [],
          weakSkills: result.weakSkills || [],
          recommendations: result.recommendations || [],
          richRecommendations: result.richRecommendations || [],
          gapScore: result.gapScore || 0,
          gapData,
          totalRequired: required.length,
        });
      } catch (err) {
        console.error('Skill analysis API error:', err);
      }
    };
    runAnalysis();
  }, [selectedRole, skills, currentUserId]);

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

      {/* Role Selector */}
      {roles.length > 0 && (
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
      )}

      {selectedRole && analysis && (
        <>
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
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Role Match Score</p>
              <div className="flex items-baseline gap-3">
                <span className={cn(
                  "text-4xl font-black",
                  analysis.matchScore >= 80 ? "text-emerald-400" : analysis.matchScore >= 50 ? "text-amber-400" : "text-rose-400"
                )}>
                  {analysis.matchScore}%
                </span>
              </div>
              <div className="mt-4 theme-progress-bar">
                <motion.div
                  className={cn(
                    "theme-progress-fill",
                    analysis.matchScore >= 80 ? "bg-emerald-500" : analysis.matchScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.matchScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-3 font-medium">
                {analysis.matchScore >= 80 ? 'Strong candidate profile' : analysis.matchScore >= 50 ? 'Moderate alignment — gaps identified' : 'Significant skill gaps detected'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="theme-card"
            >
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Skills Matched</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-blue-400">{analysis.matched.length}</span>
                <span className="text-[10px] text-zinc-500 uppercase">of {analysis.totalRequired}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {analysis.matched.slice(0, 4).map((skill: string) => (
                  <span key={skill} className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-wider">
                    {skill}
                  </span>
                ))}
                {analysis.matched.length > 4 && (
                  <span className="text-[9px] font-bold text-zinc-500 px-2 py-1">+{analysis.matched.length - 4} more</span>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="theme-card"
            >
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Critical Gaps</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-rose-400">{analysis.missing.length}</span>
                <span className="text-[10px] text-zinc-500 uppercase">missing skills</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {analysis.missing.slice(0, 4).map((skill: string) => (
                  <span key={skill} className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 uppercase tracking-wider">
                    {skill}
                  </span>
                ))}
                {analysis.missing.length > 4 && (
                  <span className="text-[9px] font-bold text-zinc-500 px-2 py-1">+{analysis.missing.length - 4} more</span>
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
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Development Plan</h3>
                </div>
                <div className="space-y-4">
                  {analysis.missing.length > 0 ? (
                    analysis.missing.slice(0, 5).map((skill: string, i: number) => (
                      <div key={skill} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-[10px] font-black">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-zinc-200">{skill}</p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Priority Gap</p>
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

                {analysis.missing.length > 0 && (
                  <button
                    onClick={() => onNavigate('library')}
                    className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Browse Learning Resources <ArrowRight className="w-3.5 h-3.5" />
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

