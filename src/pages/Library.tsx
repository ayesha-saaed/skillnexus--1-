import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Book,
  GraduationCap,
  Target,
  LayoutGrid,
  Filter,
  ChevronRight,
  Briefcase,
  Layers
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { learningService, Progress } from '../services/learningService';
import { getCurrentUser } from '../lib/firebase';
import { ACTIVE_PATH_EVENT, readActivePathFromStorage } from '../lib/activePath';
import {
  fetchLibraryResources,
  resolveCareerPathContext,
  splitResourcesByCareerPath,
  filterLibraryResources,
  enrichResourcesForCareerPath,
  groupResourcesByDomain,
  groupResourcesByType,
  RESOURCE_TYPES,
  type LibraryResource,
  type CareerPathContext
} from '../lib/libraryResources';
import { practicePlatformsForSkills } from '../lib/practicePlatforms';
import { PracticePlatformsSection } from '../components/library/PracticePlatformsSection';
import type { LinkedResource } from '../lib/resourceLinking';
import { ResourceLibraryCard, type DomainStyle } from '../components/library/ResourceLibraryCard';
import {
  Code2,
  ShieldCheck,
  BarChart3,
  Cloud,
  Lock,
  Smartphone,
  Palette,
  Zap
} from 'lucide-react';
import type { AppPage } from '../lib/navigation';

interface LibraryProps {
  onNavigate: (page: AppPage) => void;
}

const DOMAIN_STYLES: DomainStyle[] = [
  { name: 'Full Stack', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { name: 'Web Development', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { name: 'Frontend', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Backend', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'AI / Machine Learning', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { name: 'Data Science', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'DevOps', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { name: 'Cloud Computing', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { name: 'Cloud', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { name: 'Cybersecurity', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { name: 'Mobile Development', color: 'text-teal-400', bg: 'bg-teal-400/10' },
  { name: 'UI/UX Design', color: 'text-pink-400', bg: 'bg-pink-400/10' }
];

const DOMAIN_ICONS: Record<string, typeof Code2> = {
  Frontend: Code2,
  Backend: ShieldCheck,
  'Data Science': BarChart3,
  DevOps: Zap,
  'Cloud Computing': Cloud,
  Cybersecurity: Lock,
  'Mobile Development': Smartphone,
  'UI/UX Design': Palette
};

function matchBadgeFor(linked: LinkedResource | undefined): string | undefined {
  if (!linked) return undefined;
  if (linked.matchReason === 'both') return 'Path + skill';
  if (linked.matchReason === 'domain') return 'Your domain';
  return 'Required skill';
}

export function Library({ onNavigate }: LibraryProps) {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [careerPath, setCareerPath] = useState<CareerPathContext | null>(null);
  const [linkedMeta, setLinkedMeta] = useState<LinkedResource[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      const [all, path] = await Promise.all([
        fetchLibraryResources(),
        resolveCareerPathContext(user?.id)
      ]);
      setResources(all);
      setCareerPath(path);
      const split = splitResourcesByCareerPath(all, path);
      setLinkedMeta(split.linked);
    } catch (e) {
      console.error('Library load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    const onPath = () => void loadLibrary();
    window.addEventListener(ACTIVE_PATH_EVENT, onPath);
    return () => window.removeEventListener(ACTIVE_PATH_EVENT, onPath);
  }, [loadLibrary]);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;
        const progData = await learningService.getUserProgress(user.id);
        const progMap: Record<string, Progress> = {};
        progData.forEach((p) => {
          progMap[p.resourceId] = p;
        });
        setProgress(progMap);
      } catch (error) {
        console.error('Failed to load progress:', error);
      }
    };
    void loadProgress();
  }, []);

  const linkedById = useMemo(() => {
    const m = new Map<string, LinkedResource>();
    linkedMeta.forEach((l) => m.set(l.id, l));
    return m;
  }, [linkedMeta]);

  const { pathResources, otherResources } = useMemo(
    () => splitResourcesByCareerPath(resources, careerPath),
    [resources, careerPath]
  );

  const filteredBrowse = useMemo(() => {
    if (filterType === 'Practice Platform') {
      const skills = careerPath?.requiredSkills || [];
      return practicePlatformsForSkills(skills, { limit: 9 });
    }
    return filterLibraryResources(otherResources, {
      type: filterType,
      domain: filterDomain,
      difficulty: filterDifficulty
    });
  }, [otherResources, filterType, filterDomain, filterDifficulty, careerPath?.requiredSkills]);

  const browseByDomain = useMemo(() => {
    if (filterType === 'Practice Platform') return [];
    return groupResourcesByDomain(filteredBrowse);
  }, [filteredBrowse, filterType]);

  const pathEnriched = useMemo(() => {
    if (!careerPath) {
      return { learningResources: pathResources, practicePlatforms: [] as LibraryResource[] };
    }
    return enrichResourcesForCareerPath(pathResources, careerPath.requiredSkills);
  }, [pathResources, careerPath]);

  const pathByType = useMemo(
    () => groupResourcesByType(pathEnriched.learningResources),
    [pathEnriched.learningResources]
  );

  const domainNames = useMemo(() => {
    const names = new Set(resources.map((r) => r.domain).filter(Boolean));
    return ['All', ...Array.from(names).sort()];
  }, [resources]);

  const difficulties = useMemo(() => {
    const d = new Set(resources.map((r) => r.difficulty).filter(Boolean));
    return ['All', ...Array.from(d).sort()];
  }, [resources]);

  function domainStyle(name: string): DomainStyle | null {
    return DOMAIN_STYLES.find((d) => d.name === name) || null;
  }

  async function handleUpdateProgress(
    resourceId: string,
    status: 'Not Started' | 'In Progress' | 'Completed',
    incProgress: number
  ) {
    setProgress((prev) => ({
      ...prev,
      [resourceId]: {
        status,
        progress: incProgress,
        timeSpent: (prev[resourceId]?.timeSpent || 0) + 1
      }
    }));
  }

  const hasActivePath = Boolean(careerPath?.roleName || readActivePathFromStorage().roleName);

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 w-fit">
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Learning resources</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter sm:text-7xl leading-none">
            Resource
            <br />
            Library<span className="text-blue-500">.</span>
          </h1>
          <p className="text-sm text-zinc-500 max-w-xl font-medium leading-relaxed">
            Resources matched to your career path appear first. Browse everything else by domain below.
          </p>
        </div>
        {!hasActivePath && (
          <button
            type="button"
            onClick={() => onNavigate('analysis')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-colors"
          >
            <Target className="w-4 h-4" />
            Set career path
          </button>
        )}
      </div>

      {hasActivePath && careerPath && (
        <section className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/5 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Briefcase className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Your career path</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{careerPath.roleName}</h2>
              <p className="text-sm text-zinc-400">
                Domain: <span className="text-zinc-200 font-medium">{careerPath.domain}</span>
                {careerPath.requiredSkills.length > 0 && (
                  <>
                    {' '}
                    · Skills:{' '}
                    <span className="text-zinc-300">
                      {careerPath.requiredSkills.slice(0, 6).join(', ')}
                      {careerPath.requiredSkills.length > 6 ? '…' : ''}
                    </span>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analysis')}
              className="shrink-0 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-cyan-300 hover:text-white transition-colors"
            >
              Change path
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">Loading path resources…</p>
          ) : pathResources.length === 0 && pathEnriched.practicePlatforms.length === 0 ? (
            <p className="text-sm text-zinc-500 leading-relaxed">
              No resources are linked to this path yet. Add resources in Admin with matching domain (
              <span className="text-zinc-300">{careerPath.domain}</span>) or overlapping skills, or run the skill
              seed SQL.
            </p>
          ) : (
            <div className="space-y-8">
              <PracticePlatformsSection
                platforms={pathEnriched.practicePlatforms}
                progress={progress}
                matchBadge="Role skills"
                onUpdateProgress={handleUpdateProgress}
                domainStyle={domainStyle(careerPath.domain)}
              />
              {pathByType.map((group) => (
                <div key={group.type} className="space-y-4">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">{group.type}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.items.map((res, i) => (
                      <ResourceLibraryCard
                        key={res.id}
                        res={res}
                        index={i}
                        domainStyle={domainStyle(res.domain)}
                        progress={progress[res.id]}
                        matchBadge={matchBadgeFor(linkedById.get(res.id))}
                        onUpdateProgress={handleUpdateProgress}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Filter all other resources</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Domain</span>
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {domainNames.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Difficulty</span>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
        {(filterType !== 'All' || filterDomain !== 'All' || filterDifficulty !== 'All') && (
          <button
            type="button"
            onClick={() => {
              setFilterType('All');
              setFilterDomain('All');
              setFilterDifficulty('All');
            }}
            className="text-xs font-bold uppercase tracking-widest text-blue-400 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
          <LayoutGrid className="w-4 h-4 text-blue-500" />
          {hasActivePath ? 'All other learning resources' : 'All learning resources'}
          <span className="text-zinc-600 font-mono normal-case tracking-normal">
            ({filteredBrowse.length}
            {filteredBrowse.length !== otherResources.length ? ` of ${otherResources.length}` : ''})
          </span>
        </h2>

        {loading ? (
          <p className="text-sm text-zinc-500 py-12 text-center">Loading resources…</p>
        ) : filterType === 'Practice Platform' ? (
          <PracticePlatformsSection
            platforms={filteredBrowse}
            progress={progress}
            matchBadge={careerPath ? 'Role skills' : 'All platforms'}
            onUpdateProgress={handleUpdateProgress}
          />
        ) : filteredBrowse.length === 0 ? (
          <div className="theme-card min-h-[240px] flex flex-col items-center justify-center text-center p-8 border-dashed border-white/10">
            <Book className="w-10 h-10 text-zinc-700 mb-4" />
            <p className="text-sm text-zinc-400">No resources match your filters.</p>
            <button
              type="button"
              onClick={() => {
                setFilterType('All');
                setFilterDomain('All');
                setFilterDifficulty('All');
              }}
              className="mt-4 text-xs font-bold uppercase tracking-widest text-blue-400"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {browseByDomain.map(({ domain, items }) => {
              const Icon = DOMAIN_ICONS[domain] || Layers;
              const style = domainStyle(domain);
              return (
                <div key={domain} className="space-y-5">
                  <button
                    type="button"
                    onClick={() => setFilterDomain(domain)}
                    className="flex items-center gap-3 group text-left w-full"
                  >
                    <div className={`p-2.5 rounded-xl ${style?.bg || 'bg-white/5'} ${style?.color || 'text-zinc-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                        {domain}
                      </h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {items.length} resource{items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {items.map((res, i) => (
                        <ResourceLibraryCard
                          key={res.id}
                          res={res}
                          index={i}
                          domainStyle={style}
                          progress={progress[res.id]}
                          onUpdateProgress={handleUpdateProgress}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
