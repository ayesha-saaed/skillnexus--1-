import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Plus, Trash2, Search, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import { gamificationService } from '../services/gamificationService';

interface AddSkillProps {
  onNavigate: (page: any) => void;
}

export function AddSkill({ onNavigate }: AddSkillProps) {
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [proficiency, setProficiency] = useState('Beginner');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  async function fetchSkills() {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'users', auth.currentUser.uid, 'skills'));
    const snap = await getDocs(q);
    setSkills(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }

  async function handleAdd() {
    if (!newSkill.trim() || !auth.currentUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'skills'), {
        skillName: newSkill,
        proficiency,
        updatedAt: new Date().toISOString()
      });

      await gamificationService.awardPoints(auth.currentUser.uid, 20, 'Skill Registration');

      if (proficiency === 'Advanced') {
          const advancedSkills = skills.filter(s => s.proficiency === 'Advanced').length + 1;
          if (advancedSkills >= 3) {
              await gamificationService.awardBadge(auth.currentUser.uid, 'polymath');
          }
      }

      setNewSkill('');
      await fetchSkills();
    } catch (e: any) {
      console.error('Add skill error:', e);
      alert('Failed to add skill: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'skills', id));
    fetchSkills();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">My Skills</h1>
        <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">Add and manage the skills you already have</p>
      </div>

      <div className="theme-card bg-[var(--color-bg-card)]/50">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 px-1">Add a New Skill</h2>
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
              onClick={handleAdd}
              disabled={loading || !newSkill}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
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
    </div>
  );
}
