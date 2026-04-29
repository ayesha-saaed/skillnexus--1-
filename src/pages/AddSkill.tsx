import React, { useState, useEffect } from 'react';
import { User, supabase } from '../lib/firebase';
import { motion } from 'motion/react';
import { Plus, Trash2, Search, Award, BarChart3, BookOpen, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { gamificationService } from '../services/gamificationService';
import { learningService } from '../services/learningService';

interface AddSkillProps {
  onNavigate: (page: any) => void;
  user: User;
}

export function AddSkill({ onNavigate, user }: AddSkillProps) {
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [proficiency, setProficiency] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [learningStats, setLearningStats] = useState({ completedCount: 0, totalEnrolled: 0, totalTime: 0 });
  const [skillEventCount, setSkillEventCount] = useState(0);

  useEffect(() => {
    fetchSkills();
  }, [user.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const analytics = await learningService.getLearningAnalytics(user.id);
        if (!cancelled) setLearningStats(analytics);
      } catch {
        if (!cancelled) setLearningStats({ completedCount: 0, totalEnrolled: 0, totalTime: 0 });
      }
      try {
        const { count, error } = await supabase
          .from('skill_development_events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (!cancelled && !error && typeof count === 'number') setSkillEventCount(count);
      } catch {
        /* table may not exist until SQL bundle is applied */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id, skills.length]);

  async function fetchSkills() {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setSkills((data || []).map((s: any) => ({ id: s.id, skillName: s.skill_name, proficiency: s.proficiency })));
    } catch (e: any) {
      const message = e?.message || 'Unknown error';
      if (message.includes('Missing or insufficient permissions')) {
        setErrorMessage('Permission denied while loading skills. Check Supabase RLS policies for user_skills.');
      } else {
        setErrorMessage(`Failed to load skills: ${message}`);
      }
    }
  }

  async function handleAdd() {
    const trimmedSkill = newSkill.trim();
    if (!trimmedSkill) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.from('user_skills').insert({
        user_id: user.id,
        skill_name: trimmedSkill,
        proficiency,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;

      try {
        await supabase.from('skill_development_events').insert({
          user_id: user.id,
          skill_name: trimmedSkill,
          event_type: 'added',
          detail: { proficiency },
        });
      } catch {
        /* optional table */
      }

      await gamificationService.awardPoints(user.id, 20, 'Skill Registration');

      if (proficiency === 'Advanced') {
          const advancedSkills = skills.filter(s => s.proficiency === 'Advanced').length + 1;
          if (advancedSkills >= 3) {
              await gamificationService.awardBadge(user.id, 'polymath');
          }
      }

      setNewSkill('');
      await fetchSkills();
    } catch (e: any) {
      console.error('Add skill error:', e);
      const message = e?.message || 'Unknown error';
      if (message.includes('Missing or insufficient permissions')) {
        setErrorMessage('Permission denied. Sign in and ensure RLS allows inserts on user_skills.');
      } else {
        setErrorMessage(`Failed to add skill: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const row = skills.find((s) => s.id === id);
    await supabase.from('user_skills').delete().eq('id', id).eq('user_id', user.id);
    if (row?.skillName) {
      try {
        await supabase.from('skill_development_events').insert({
          user_id: user.id,
          skill_name: row.skillName,
          event_type: 'deleted',
          detail: {},
        });
      } catch {
        /* optional */
      }
    }
    fetchSkills();
  }

  const beginnerCount = skills.filter((s) => s.proficiency === 'Beginner').length;
  const nextSteps: { title: string; detail: string }[] = [];
  if (skills.length === 0) {
    nextSteps.push({
      title: 'Add your first skill',
      detail: 'List tools and languages you already use so gap analysis can compare you to real job profiles.',
    });
  } else {
    nextSteps.push({
      title: 'Run skill gap analysis',
      detail: 'We load these skills automatically—pick a target role and see missing and weak areas without typing a long story.',
    });
    if (beginnerCount > 0) {
      nextSteps.push({
        title: 'Level up beginner tags',
        detail: 'Pick one beginner skill and complete a short course in the Library, then bump proficiency here.',
      });
    }
    nextSteps.push({
      title: 'Track learning in the Library',
      detail: 'Mark resources in progress or completed—your progress summary updates on this page.',
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">My Skills</h1>
        <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">Add and manage the skills you already have</p>
      </div>

      <div className="theme-card bg-[var(--color-bg-card)]/50">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 px-1">Add a New Skill</h2>
        {errorMessage && (
          <p className="mb-4 px-1 text-xs text-rose-400">{errorMessage}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-6">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Skill Name</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. JavaScript, Python, React"
                className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-zinc-500"
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Proficiency Level</label>
            <select
              aria-label="Proficiency level"
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:border-blue-500 outline-none transition-all appearance-none text-white"
            >
              <option className="bg-[#111]">Beginner</option>
              <option className="bg-[#111]">Intermediate</option>
              <option className="bg-[#111]">Advanced</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              aria-label="Add skill"
              onClick={handleAdd}
              disabled={loading || !newSkill}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="theme-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Learning progress</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{learningStats.completedCount}</span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold">completed</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            {learningStats.totalEnrolled} resources tracked · {learningStats.totalTime || 0} min logged
          </p>
        </div>
        <div className="theme-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Skill development log</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-400">{skillEventCount}</span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold">events</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Adds and removes are recorded when the skill timeline table is enabled in Supabase.
          </p>
        </div>
        <div className="theme-card flex flex-col justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
onClick={() => onNavigate('analysis')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Gap analysis
            </button>
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-200"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Library
            </button>
          </div>
        </div>
      </div>

      <div className="theme-card !p-0 overflow-hidden">
        <div className="px-4 sm:px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Skill List</h2>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">{skills.length} Skills</span>
        </div>
        <div className="divide-y divide-white/5">
          {skills.length > 0 ? (
            skills.map((skill) => (
              <div key={skill.id} className="px-4 sm:px-8 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 transition-colors">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-200">{skill.skillName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border leading-none",
                        skill.proficiency === 'Advanced' ? "border-emerald-500/30 text-emerald-400 bg-emerald-400/5" : 
                        skill.proficiency === 'Intermediate' ? "border-blue-500/30 text-blue-400 bg-blue-400/5" : "border-rose-500/30 text-rose-400 bg-rose-400/5"
                      )}>
                        {skill.proficiency}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  aria-label={`Delete ${skill.skillName}`}
                  onClick={() => handleDelete(skill.id)}
                  className="p-2.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="px-4 sm:px-8 py-20 text-center text-zinc-600">
              <p className="text-[10px] uppercase font-bold tracking-widest">No skills added yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="theme-card border-amber-500/15 bg-amber-500/[0.04]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">What to do next</h2>
        </div>
        <ul className="space-y-3">
          {nextSteps.map((step) => (
            <li key={step.title} className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
              <p className="text-xs font-bold text-zinc-100">{step.title}</p>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{step.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
