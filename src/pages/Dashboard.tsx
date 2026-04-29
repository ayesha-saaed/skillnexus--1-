import React, { useState, useEffect } from 'react';
import { User, supabase } from '../lib/firebase';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import {
  Award,
  BookOpen,
  Star,
  ArrowRight,
  Zap,
  Target,
  PlusCircle,
  Loader2,
  GraduationCap,
  LineChart,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { learningService } from '../services/learningService';

// ─── Proper TypeScript Interfaces ───
interface UserSkill {
  id?: string;
  skillName: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  updatedAt?: string;
}

interface ProgressEntry {
  id?: string;
  user_id: string;
  [key: string]: any;
}

interface UserProfile {
  name?: string;
  email?: string;
  role?: string;
  points?: number;
  level?: number;
  badges?: string[];
  createdAt?: string;
  active_job_role_id?: string | null;
  active_job_role_name?: string | null;
  active_path_domain?: string | null;
}

interface DashboardStats {
  industryMatch: number;
  activeCourses: number;
  openGaps: number;
}

interface DashboardProps {
  user: User;
  onNavigate: (page: any) => void;
}

const proficiencyMap: Record<string, number> = {
  Beginner: 30,
  Intermediate: 70,
  Advanced: 100,
};

// ─── Loading Skeleton Components ───
function StatCardSkeleton() {
  return (
    <div className="theme-card animate-pulse">
      <div className="h-2.5 w-24 bg-white/5 rounded mb-3"></div>
      <div className="h-8 w-16 bg-white/5 rounded mb-4"></div>
      <div className="h-1.5 w-full bg-white/5 rounded-full"></div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="theme-card relative flex flex-col animate-pulse">
      <div className="h-4 w-32 bg-white/5 rounded mb-10"></div>
      <div className="h-[350px] w-full bg-white/[0.02] rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-700 animate-spin" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="h-16 bg-white/[0.02] rounded-lg"></div>
        <div className="h-16 bg-white/[0.02] rounded-lg"></div>
      </div>
    </div>
  );
}

function SkillListSkeleton() {
  return (
    <div className="theme-card flex flex-col h-full animate-pulse">
      <div className="h-4 w-24 bg-white/5 rounded mb-8"></div>
      <div className="space-y-5 flex-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-white/5"></div>
            <div className="flex-1">
              <div className="h-3 w-24 bg-white/5 rounded mb-1.5"></div>
              <div className="h-1 w-full bg-white/5 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Component ───
export const Dashboard = React.memo(function Dashboard({ user, onNavigate }: DashboardProps) {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [enrollments, setEnrollments] = useState<ProgressEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    industryMatch: 0,
    activeCourses: 0,
    openGaps: 0,
  });
  const [learningAnalytics, setLearningAnalytics] = useState({
    completedCount: 0,
    totalEnrolled: 0,
    totalTime: 0,
  });


  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        // ✅ Parallel queries instead of sequential
        const [skillsRes, progRes, profileRes] = await Promise.all([
          supabase.from('user_skills').select('*').eq('user_id', user.id),
          supabase.from('progress').select('*').eq('user_id', user.id),
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        ]);

        if (cancelled) return;

        if (skillsRes.error) throw skillsRes.error;
        if (progRes.error) throw progRes.error;
        if (profileRes.error) throw profileRes.error;

        try {
          const analytics = await learningService.getLearningAnalytics(user.id);
          if (!cancelled) setLearningAnalytics(analytics);
        } catch {
          if (!cancelled) setLearningAnalytics({ completedCount: 0, totalEnrolled: 0, totalTime: 0 });
        }

        const skillsData = (skillsRes.data || []).map((d: any) => ({
          id: d.id,
          skillName: d.skill_name,
          proficiency: d.proficiency,
          updatedAt: d.updated_at
        } as UserSkill));
        const enrollmentsData = (progRes.data || []) as ProgressEntry[];
        const profileData = profileRes.data as UserProfile | null;

        setSkills(skillsData);
        setEnrollments(enrollmentsData);
        setProfile(profileData || null);

        // ✅ Compute dynamic stats from real data
        const activeCourses = enrollmentsData.length;

        // Industry Match: weighted average of proficiency levels
        const totalProficiency = skillsData.reduce(
          (sum, s) => sum + (proficiencyMap[s.proficiency] || 0),
          0
        );
        const maxPossible = skillsData.length * 100;
        const industryMatch =
          maxPossible > 0
            ? Math.round((totalProficiency / maxPossible) * 100)
            : 0;

        // Open Gaps: estimate based on beginner skills + missing from expected set
        const beginnerCount = skillsData.filter(
          (s) => s.proficiency === 'Beginner'
        ).length;
        const openGaps = Math.max(2, beginnerCount + Math.max(0, 5 - skillsData.length));

        setStats({
          industryMatch: Math.min(industryMatch, 100),
          activeCourses,
          openGaps,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user.id]);



  // ─── Loading State with Skeleton UI ───
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-56 bg-white/5 rounded animate-pulse"></div>
            <div className="h-2.5 w-40 bg-white/5 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-white/5 rounded-lg animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <ChartSkeleton />
          </div>
          <div className="lg:col-span-4">
            <SkillListSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Growth Dashboard
          </h1>
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">
            Track your skill progress and industry match
          </p>
        </div>
        <button
          onClick={() => onNavigate('add-skill')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 w-fit shadow-lg shadow-blue-500/20"
        >
          Add Skills <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Skill Trajectory Report Card */}


      {/* Stats Grid — Dynamic Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="theme-card">
          <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase tracking-widest">
            Industry Match
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-emerald-400">
              {stats.industryMatch}%
            </span>
            <span className="text-[10px] text-emerald-500/60 uppercase">
              {stats.industryMatch >= 80 ? '+4% week' : 'Growing'}
            </span>
          </div>
          <div className="mt-4 theme-progress-bar">
            <motion.div
              className="theme-progress-fill bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${stats.industryMatch}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="theme-card">
          <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase tracking-widest">
            Learning Progress
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-blue-400">
              {stats.activeCourses}
            </span>
            <span className="text-[10px] text-blue-500/60 uppercase">
              Active Courses
            </span>
          </div>
          <div className="mt-4 theme-progress-bar">
            <motion.div
              className="theme-progress-fill bg-blue-500"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(stats.activeCourses * 20, 100)}%`,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="theme-card">
          <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase tracking-widest">
            Open Gaps
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-rose-400">
              {String(stats.openGaps).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-rose-500/60 uppercase">
              {stats.openGaps >= 5 ? 'Critical' : 'Manageable'}
            </span>
          </div>
          <div className="mt-4 theme-progress-bar">
            <motion.div
              className="theme-progress-fill bg-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stats.openGaps * 12, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="theme-card">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Active career path
          </h2>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            The job role you choose in Gap Checker is saved as your active path and shown in the header.
          </p>
          {profile?.active_job_role_name ? (
            <div className="mt-5 space-y-1">
              <p className="text-lg font-bold text-white tracking-tight">{profile.active_job_role_name}</p>
              {profile.active_path_domain ? (
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{profile.active_path_domain}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-[11px] text-zinc-500">No target role yet. Open Gap Checker and pick a role.</p>
          )}
          <button
            type="button"
            onClick={() => onNavigate('analysis')}
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Open Gap Checker
          </button>
        </div>

        <div className="theme-card">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            Learning &amp; skill development
          </h2>
          <p className="text-[11px] text-zinc-500 leading-relaxed mb-5">
            Library progress plus a timeline when skill events are enabled in Supabase.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-center">
              <p className="text-2xl font-black text-emerald-400">{learningAnalytics.completedCount}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Done</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-center">
              <p className="text-2xl font-black text-blue-400">{learningAnalytics.totalEnrolled}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Enrolled</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-center">
              <p className="text-2xl font-black text-amber-400">{learningAnalytics.totalTime}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Minutes</p>
            </div>
          </div>
          <div className="mt-5 border-t border-white/5 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <LineChart className="w-3.5 h-3.5" />
              Recent skill activity
            </p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">No skill timeline rows yet (run SQL bundle if needed).</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-blue-600 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Resource library
          </button>
        </div>
      </div>

      {/* Skills Inventory */}
      <div className="theme-card flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">
            Inventory
          </h2>
          <button
            onClick={() => onNavigate('add-skill')}
            className="text-[10px] text-zinc-500 uppercase font-bold hover:text-white transition-colors"
          >
            Manage
          </button>
        </div>
        <div className="space-y-5 flex-1">
          {skills.slice(0, 12).map((skill, i) => (
            <div
              key={skill.id || i}
              className="flex items-center space-x-4 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                <Star className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1.5">
                  <p className="text-xs font-semibold text-zinc-200 truncate">
                    {skill.skillName}
                  </p>
                  <span
                    className={cn(
                      'theme-tag',
                      skill.proficiency === 'Advanced'
                        ? 'theme-tag-emerald'
                        : skill.proficiency === 'Intermediate'
                          ? 'theme-tag-blue'
                          : 'theme-tag-rose'
                    )}
                  >
                    {skill.proficiency}
                  </span>
                </div>
                <div className="theme-progress-bar h-1">
                  <div
                    className={cn(
                      'theme-progress-fill',
                      skill.proficiency === 'Advanced'
                        ? 'bg-emerald-500'
                        : skill.proficiency === 'Intermediate'
                          ? 'bg-blue-500'
                          : 'bg-rose-500'
                    )}
                    style={{ width: `${proficiencyMap[skill.proficiency]}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {skills.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Award className="w-8 h-8 mb-4 opacity-20" />
              <p className="text-[10px] uppercase font-bold tracking-widest">
                No assets logged
              </p>
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-white/5 mt-8">
          <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-4">
            Industry Demand
          </h4>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
            <span className="text-[11px] text-zinc-400">Market Value</span>
            <span className="text-[11px] font-bold text-emerald-400">
              +1.2%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="theme-card bg-indigo-600/5 border-indigo-500/10 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Nexus IQ Rank
            </h2>
            <div className="flex items-center gap-6">
              <div className="text-5xl font-black text-white tracking-tighter italic">
                #{profile?.level || 1}
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  Architecture Level
                </p>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-6 rounded-full ${
                        i < (profile?.level || 1)
                          ? 'bg-blue-500'
                          : 'bg-white/5'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
              You currently possess{' '}
              <span className="text-blue-500 font-bold">
                {profile?.points || 0} Nexus IQ
              </span>
              . Earn{' '}
              {500 - ((profile?.points || 0) % 500)} more points to reach level{' '}
              {(profile?.level || 1) + 1}.
            </p>
          </div>
          <button
            onClick={() => onNavigate('library')}
            className="w-full mt-6 flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-all uppercase tracking-[0.2em]"
          >
            Boost My IQ <PlusCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;

