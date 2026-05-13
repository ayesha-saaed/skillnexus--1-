import React, { useState, useEffect, useRef } from 'react';
import { supabase, getAccessToken } from '../lib/supabase';
import { getCurrentUser } from '../lib/firebase';
import { Target, CheckCircle, AlertCircle, ArrowRight, BookOpen, Search, X, BarChart3, Download } from 'lucide-react';
import { JOB_ROLES, PROFICIENCY_SCORES, DEFAULT_REQUIRED_PROFICIENCY, LEARNING_RESOURCES } from '../lib/knowledge_base';
import { resources } from '../lib/resources';
import { persistActivePath, type ActivePathPayload } from '../lib/activePath';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────

interface RequiredSkill {
  name: string;
  importance: number;
  requiredProficiency: number;
}

interface Domain {
  id: string;
  name: string;
  domain: string;
  requiredSkills: RequiredSkill[];
}

interface GapResult {
  jobRole: string;
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: string[];
  nextSteps: string[];
  matchPercent: number;
  recommendedResources: Array<{title: string; skillsCovered: string[]; url: string}>;
  chartData?: Array<{skill: string; yourScore: number; required: number; status: 'matched' | 'weak' | 'missing'; importance: number}>;
}


interface SkillAnalysisProps {
  user?: any;
  onNavigate: (page: any) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────



// ── Component ─────────────────────────────────────────────────────────────────

export function SkillAnalysis({ user, onNavigate }: SkillAnalysisProps): React.JSX.Element {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [userSkills, setUserSkills] = useState<{name: string; proficiency: string}[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedUserSkill, setSelectedUserSkill] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);
  const [matchPercent, setMatchPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const JOB_ROLE_DOMAINS: Domain[] = JOB_ROLES.map((role, index) => ({
    id: `job-${index}`,
    name: role.jobRole,
    domain: role.domain,
    requiredSkills: role.requiredSkills
  }));

  // Load domains and current user skills on mount
  useEffect(() => {
    async function loadData() {
      setFetchingData(true);
      try {
        setDomains(JOB_ROLE_DOMAINS); // Static fallback while DB roles load

        const currentUser = await getCurrentUser();
        let authToken: string | null = null;

        if (currentUser) {
          const { data: skillData } = await supabase
            .from('user_skills')
            .select('skill_name, proficiency_level')
            .eq('user_id', currentUser.id);
          setUserSkills((skillData || []).map((s: any) => ({ name: s.skill_name, proficiency: s.proficiency_level || 'Beginner' })));
          authToken = await getAccessToken();
        }

        if (authToken) {
          const response = await fetch('/api/job-roles', {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (response.ok) {
            const roleData = await response.json();
            setDomains((roleData || []).map((role: any, index: number) => ({
              id: role.id || `job-db-${index}`,
              name: role.role_name,
              domain: role.domain || 'General',
              requiredSkills: (role.required_skills || []).map((name: string) => ({ name, importance: 0.8, requiredProficiency: 0.8 }))
            })));
          } else {
            console.warn('Job role API failed', response.status, await response.text());
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, []);

  async function handleAnalyze() {
    if (!selectedDomainId) return;

    const domain = domains.find(d => d.id === selectedDomainId);
    if (!domain) return;

    setLoading(true);
    setResult(null);

    // Use requiredSkills from job role
    const requiredSkills = domain.requiredSkills;

    // Compute gaps with proficiency
    const matchedSkills: string[] = [];
    const missingSkills: RequiredSkill[] = [];
    const weakSkills: {name: string; gap: number}[] = [];
    let totalImportance = 0;
    let weightedScore = 0;

    requiredSkills.forEach(req => {
      totalImportance += req.importance;
      const userSkill = userSkills.find(s => s.name.toLowerCase() === req.name.toLowerCase());
      const userScore = PROFICIENCY_SCORES[userSkill?.proficiency || ''] || 0;
      const scoreRatio = userScore / req.requiredProficiency;

      if (userScore >= req.requiredProficiency) {
        matchedSkills.push(req.name);
        weightedScore += req.importance * 1;
      } else if (userScore > 0) {
        weakSkills.push({name: req.name, gap: req.requiredProficiency - userScore});
        weightedScore += req.importance * scoreRatio;
      } else {
        missingSkills.push(req);
      }
    });

    const computedMatchPercent = Math.round((weightedScore / totalImportance) * 100);
    setMatchPercent(computedMatchPercent);

    // Sort gaps by importance desc
    missingSkills.sort((a, b) => b.importance - a.importance);
    weakSkills.sort((a, b) => (requiredSkills.find(r => r.name === a.name)?.importance || 0) - (requiredSkills.find(r => r.name === b.name)?.importance || 0));

    // Chart data
    const chartData = requiredSkills.slice(0, 10).map(req => {
      const userSkill = userSkills.find(s => s.name.toLowerCase() === req.name.toLowerCase());
      const userScore = PROFICIENCY_SCORES[userSkill?.proficiency || ''] || 0;
      let status: 'matched' | 'weak' | 'missing' = 'missing';
      if (userScore >= req.requiredProficiency) status = 'matched';
      else if (userScore > 0) status = 'weak';
      return {
        skill: req.name,
        yourScore: userScore,
        required: req.requiredProficiency,
        status,
        importance: req.importance
      };
    });

    // Prioritized next steps
    const nextSteps: string[] = [];
    if (missingSkills.length === 0 && weakSkills.length === 0) {
      nextSteps.push('✅ Perfect match! You meet all requirements for this role.');
      nextSteps.push('Build projects and contribute to open source.');
      nextSteps.push('Explore advanced topics and certifications.');
    } else {
      if (missingSkills.length > 0) {
        const topMissing = missingSkills.slice(0, 3).map(m => m.name).join(', ');
        nextSteps.push(`1. Learn priority gaps: ${topMissing}`);
      }
      if (weakSkills.length > 0) {
        const topWeak = weakSkills.slice(0, 2).map(w => w.name).join(', ');
        nextSteps.push(`2. Improve proficiency in: ${topWeak}`);
      }
      nextSteps.push('3. Check recommended resources below.');
      nextSteps.push('4. Apply learning through small projects.');
      nextSteps.push('5. Track progress in your skill dashboard.');
    }

    // Resources matching gaps
    const gapSkills = [...matchedSkills, ...missingSkills.map(m => m.name), ...weakSkills.map(w => w.name)];
    const recommendedResources: Array<{title: string; skillsCovered: string[]; url: string}> = [];
    (resources as any[]).concat(LEARNING_RESOURCES).forEach((r: any) => {
      if (gapSkills.some(gap => r.skillsCovered.some((sc: string) => sc.toLowerCase() === gap.toLowerCase()))) {
        recommendedResources.push({title: r.title, skillsCovered: r.skillsCovered, url: r.url || '#' });
      }
    });

    const finalResult: GapResult = {
      jobRole: domain.name,
      matchedSkills,
      missingSkills: missingSkills.map(m => m.name),
      weakSkills: weakSkills.map(w => w.name),
      nextSteps,
      matchPercent: computedMatchPercent,
      recommendedResources: recommendedResources.slice(0, 4),
      chartData
    };

    setResult(finalResult);

    // Persist active path
    const currentUser = await getCurrentUser();
    if (currentUser?.id) {
      persistActivePath({
        roleName: domain.name,
        domain: domain.domain,
        missingSkills: missingSkills.map(m => m.name),
        weakSkills: weakSkills.map(w => w.name),
      } as ActivePathPayload, currentUser.id);
    }

    setLoading(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-8">

      {/* ── Header ── */}
      <div className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Skill Gap Checker</h1>
        <p className="text-zinc-500 text-sm mt-2">
          Select a job role to see which skills you already have and what you still need to learn.
        </p>
      </div>

      {/* ── Role Selector ── */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Select a Job Role
        </label>

        {/* Searchable input with suggestions */}
        <div className="relative" ref={suggestionsRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a role e.g. Frontend, DevOps..."
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value);
              setShowSuggestions(true);
              // Clear selection if user edits
              if (selectedDomainId) { setSelectedDomainId(''); setResult(null); }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full bg-black/60 border border-white/10 text-white rounded-xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
          />
          {searchInput && (
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setSearchInput(''); setSelectedDomainId(''); setResult(null); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-zinc-500 hover:text-white transition-colors" />
            </button>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
              {domains
                .filter(d => !searchInput || d.name.toLowerCase().includes(searchInput.toLowerCase()))
                .map(d => (
                  <button
                    key={d.id}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setSelectedDomainId(d.id);
                      setSearchInput(d.name);
                      setShowSuggestions(false);
                      setResult(null);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between
                      ${selectedDomainId === d.id
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    {d.name}
                    {selectedDomainId === d.id && (
                      <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                  </button>
                ))
              }
              {domains.filter(d => !searchInput || d.name.toLowerCase().includes(searchInput.toLowerCase())).length === 0 && (
                <p className="px-4 py-3 text-zinc-600 text-sm">No matching roles found</p>
              )}
            </div>
          )}
        </div>

        {/* Selected role pill */}
        {selectedDomainId && (
          <p className="text-xs text-blue-400">
            ✓ Selected: <span className="font-semibold">{searchInput}</span>
          </p>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !selectedDomainId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Analyzing...' : (
            <>
              <Target className="w-4 h-4" />
              Analyze My Skills
            </>
          )}
        </button>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-6">

          {/* Summary Bar */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-base">{result.jobRole}</h2>
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-bold text-lg">{result?.matchPercent ?? 0}% Match</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${result?.matchPercent ?? 0}%` }}
              />
            </div>
            <p className="text-zinc-500 text-xs mt-2">
              {result.matchedSkills.length} matched skills, {result.missingSkills.length} missing, {result.weakSkills.length} weak
            </p>
          </div>

          {/* Analyzer Graph */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Skill Gap Analyzer
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#37415140" vertical={false} />
                  <XAxis dataKey="skill" angle={-45} height={80} tick={{ fill: '#f8fafc', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <YAxis type="number" domain={[0, 1]} tickLine={false} axisLine={false} tick={{ fill: '#f8fafc', fontSize: 12, fontWeight: 600 }} />
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
                  <Bar dataKey="required" stackId="a" fill="#6b728020" name="Required" stroke="#ffffff" strokeWidth={1.5} />
                  <Bar dataKey="yourScore" stackId="a" name="Your Level" stroke="#ffffff" strokeWidth={1.5}>
                    {result.chartData!.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.yourScore >= entry.required ? "#10b981" : entry.yourScore > 0 ? "#f59e0b" : "#ef4444"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-zinc-500 text-xs mt-3 text-center">
              Green = You have it | Red = Gap to fill
            </p>
          </div>

        {/* Recommended Resources */}
        {result.recommendedResources.length > 0 && (
          <div className="bg-zinc-900 border border-emerald-500/20 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-4">
              <BookOpen className="w-4 h-4" />
              Recommended Learning Resources ({result.recommendedResources.length})
            </h3>
            <div className="space-y-3">
              {result.recommendedResources.map((res, i) => (
                <a 
                  key={i}
                  href={res.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-zinc-300 hover:text-white"
                >
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">{res.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">Covers: {res.skillsCovered.join(', ')}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}


          {/* Next Steps */}
          <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-blue-400 font-semibold text-sm mb-4">What To Do Next</h3>
            <ol className="space-y-3">
              {result.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-zinc-300 text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA to Library */}
          <button
            onClick={() => onNavigate('library')}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-4 rounded-2xl text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Find Learning Resources for This Role
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      )}
    </div>
  );
}