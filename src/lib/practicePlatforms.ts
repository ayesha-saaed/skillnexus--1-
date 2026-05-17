import { skillMatchKey } from './skillMatching';
import type { Resource } from '../types/database';

export const PRACTICE_PLATFORM_TYPE = 'Practice Platform';
export const PRACTICE_PLATFORMS_SECTION = 'Practice Platforms';

export type PracticePlatformDef = {
  id: string;
  platform: string;
  title: string;
  description: string;
  url: string;
  skillsCovered: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  domain: string;
};

/** Curated coding practice platforms (single canonical entry each — no per-skill duplicates). */
export const PRACTICE_PLATFORMS: PracticePlatformDef[] = [
  {
    id: 'practice-leetcode',
    platform: 'LeetCode',
    title: 'LeetCode',
    description: 'Interview-style coding challenges, contests, and company-specific problem sets.',
    url: 'https://leetcode.com/',
    skillsCovered: [
      'JavaScript',
      'Python',
      'Java',
      'C++',
      'TypeScript',
      'Data Structures',
      'Algorithms',
      'SQL',
      'System Design'
    ],
    difficulty: 'Intermediate',
    domain: 'General'
  },
  {
    id: 'practice-codechef',
    platform: 'CodeChef',
    title: 'CodeChef',
    description: 'Competitive programming practice, long challenges, and learning paths.',
    url: 'https://www.codechef.com/',
    skillsCovered: ['Python', 'Java', 'C++', 'Algorithms', 'Data Structures', 'Competitive Programming'],
    difficulty: 'Intermediate',
    domain: 'General'
  },
  {
    id: 'practice-hackerrank',
    platform: 'HackerRank',
    title: 'HackerRank',
    description: 'Skill tracks, certifications, and hands-on coding exercises by technology.',
    url: 'https://www.hackerrank.com/',
    skillsCovered: [
      'JavaScript',
      'Python',
      'Java',
      'SQL',
      'React',
      'Node.js',
      'Problem Solving',
      'Data Structures'
    ],
    difficulty: 'Beginner',
    domain: 'General'
  },
  {
    id: 'practice-exercism',
    platform: 'Exercism',
    title: 'Exercism',
    description: 'Mentored coding exercises across many languages with a focus on fundamentals.',
    url: 'https://exercism.org/',
    skillsCovered: [
      'JavaScript',
      'TypeScript',
      'Python',
      'Rust',
      'Go',
      'Java',
      'Elixir',
      'Programming Fundamentals'
    ],
    difficulty: 'Beginner',
    domain: 'General'
  },
  {
    id: 'practice-codewars',
    platform: 'Codewars',
    title: 'Codewars',
    description: 'Kata-style challenges ranked by difficulty with community solutions.',
    url: 'https://www.codewars.com/',
    skillsCovered: ['JavaScript', 'Python', 'TypeScript', 'Ruby', 'Java', 'Algorithms', 'Problem Solving'],
    difficulty: 'Intermediate',
    domain: 'General'
  },
  {
    id: 'practice-codecrafters',
    platform: 'CodeCrafters',
    title: 'CodeCrafters',
    description: 'Build real-world tools (Git, Redis, Docker, SQLite) step by step in your language.',
    url: 'https://codecrafters.io/',
    skillsCovered: ['Python', 'Go', 'Rust', 'Git', 'Redis', 'Docker', 'Networking', 'Backend'],
    difficulty: 'Advanced',
    domain: 'Backend'
  },
  {
    id: 'practice-edabit',
    platform: 'Edabit',
    title: 'Edabit',
    description: 'Short, game-like coding challenges ideal for building daily practice habits.',
    url: 'https://edabit.com/',
    skillsCovered: ['JavaScript', 'Python', 'Java', 'C#', 'Problem Solving', 'Programming Fundamentals'],
    difficulty: 'Beginner',
    domain: 'General'
  },
  {
    id: 'practice-codecademy',
    platform: 'Codecademy',
    title: 'Codecademy',
    description: 'Interactive lessons and projects across web, data, and computer science tracks.',
    url: 'https://www.codecademy.com/',
    skillsCovered: [
      'JavaScript',
      'Python',
      'HTML',
      'CSS',
      'SQL',
      'React',
      'TypeScript',
      'Data Science',
      'Web Development'
    ],
    difficulty: 'Beginner',
    domain: 'General'
  },
  {
    id: 'practice-mimo',
    platform: 'Mimo',
    title: 'Mimo',
    description: 'Mobile-friendly bite-sized coding lessons and practice for web and Python.',
    url: 'https://mimo.org/',
    skillsCovered: ['JavaScript', 'Python', 'HTML', 'CSS', 'Web Development', 'Programming Fundamentals'],
    difficulty: 'Beginner',
    domain: 'General'
  }
];

const platformKeysCache = new Map<string, Set<string>>();

function keysForPlatform(def: PracticePlatformDef): Set<string> {
  const cached = platformKeysCache.get(def.id);
  if (cached) return cached;
  const keys = new Set(def.skillsCovered.map((s) => skillMatchKey(s)).filter(Boolean));
  platformKeysCache.set(def.id, keys);
  return keys;
}

function scorePlatform(def: PracticePlatformDef, roleSkillKeys: string[]): number {
  if (!roleSkillKeys.length) return 1;
  const platformKeys = keysForPlatform(def);
  let score = 0;
  for (const roleKey of roleSkillKeys) {
    for (const pk of platformKeys) {
      if (pk === roleKey || pk.includes(roleKey) || roleKey.includes(pk)) {
        score += 2;
        break;
      }
    }
  }
  return score;
}

export function practicePlatformToResource(def: PracticePlatformDef): Resource {
  return {
    id: def.id,
    title: def.title,
    description: def.description,
    url: def.url,
    type: PRACTICE_PLATFORM_TYPE,
    platform: def.platform,
    skillsCovered: def.skillsCovered,
    difficulty: def.difficulty,
    domain: def.domain,
    rating: null,
    duration: null
  };
}

/** Rank practice platforms by overlap with role / gap skills. */
export function practicePlatformsForSkills(
  skills: string[],
  options?: { limit?: number; minScore?: number }
): Resource[] {
  const limit = options?.limit ?? PRACTICE_PLATFORMS.length;
  const roleSkillKeys = [...new Set(skills.map((s) => skillMatchKey(s)).filter(Boolean))];

  const ranked = PRACTICE_PLATFORMS.map((def) => ({
    def,
    score: scorePlatform(def, roleSkillKeys)
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.def.platform.localeCompare(b.def.platform);
  });

  const minScore = options?.minScore ?? (roleSkillKeys.length ? 1 : 0);
  const picked =
    roleSkillKeys.length === 0
      ? ranked.slice(0, limit)
      : ranked.filter((r) => r.score >= minScore).slice(0, limit);

  const finalList = picked.length > 0 ? picked : ranked.slice(0, Math.min(limit, 6));
  return finalList.map((r) => practicePlatformToResource(r.def));
}

export function isDocumentationResource(type: string | null | undefined): boolean {
  return (type || '').trim().toLowerCase() === 'documentation';
}

/** Drop seeded doc links, generic search URLs, and duplicate low-quality practice rows. */
export function isLowQualityLearningResource(resource: {
  type?: string | null;
  title?: string | null;
  url?: string | null;
  platform?: string | null;
}): boolean {
  if (isDocumentationResource(resource.type)) return true;
  const title = (resource.title || '').trim();
  const url = (resource.url || '').toLowerCase();
  const platform = (resource.platform || '').toLowerCase();

  if (title.includes(' — Official Documentation')) return true;
  if (title.includes(' — Practice & Exercises')) return true;
  if (title.includes(' — Coursera Courses') && url.includes('coursera.org/search')) return true;
  if (title.includes(' — YouTube Tutorials') && url.includes('youtube.com/results')) return true;
  if (title.includes(' — Articles & Guides') && url.includes('google.com/search')) return true;
  if (url.includes('skillnexus.dev/learn/')) return true;
  if (platform === 'freecodecamp' && url.includes('freecodecamp.org/news/search')) return true;
  if (url.includes('developer.mozilla.org') && url.includes('/search')) return true;

  return false;
}

export function isLegacyPracticePlatformRow(resource: {
  type?: string | null;
  id?: string | null;
  platform?: string | null;
  title?: string | null;
}): boolean {
  if (resource.type !== PRACTICE_PLATFORM_TYPE) return false;
  const id = resource.id || '';
  if (id.startsWith('practice-')) return false;
  const known = new Set(PRACTICE_PLATFORMS.map((p) => p.platform.toLowerCase()));
  const label = (resource.platform || resource.title || '').trim().toLowerCase();
  if (known.has(label)) return false;
  return true;
}
