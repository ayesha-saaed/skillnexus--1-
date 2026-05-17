import { normalizeSkill } from './skillNormalization';

export interface LinkedResource {
  id: string;
  title: string;
  url: string;
  type: string;
  difficulty: string;
  domain: string;
  skills_covered: string[];
  matchReason: 'domain' | 'skill' | 'both';
}

export type ResourceLike = {
  id: string;
  title: string;
  url: string;
  type?: string | null;
  difficulty?: string | null;
  domain?: string | null;
  skills_covered?: string[] | null;
};

function normLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function domainMatches(resourceDomain: string, targetDomain: string): boolean {
  const r = normLabel(resourceDomain);
  const t = normLabel(targetDomain);
  if (!r || !t) return false;
  return r === t || r.includes(t) || t.includes(r);
}

function skillSetsOverlap(resourceSkills: string[], requiredSkills: string[]): boolean {
  if (!requiredSkills.length || !resourceSkills.length) return false;
  const required = new Set(requiredSkills.map((s) => normLabel(normalizeSkill(s))));
  return resourceSkills.some((s) => required.has(normLabel(normalizeSkill(s))));
}

/** Resources linked to a job role: same domain and/or overlapping required skills. */
export function resourcesForJobRole(
  resources: ResourceLike[],
  role: { domain: string; required_skills: string[] }
): LinkedResource[] {
  const domain = role.domain?.trim() || '';
  const required = role.required_skills || [];
  const out: LinkedResource[] = [];

  for (const res of resources) {
    const skills = res.skills_covered || [];
    const byDomain = domain ? domainMatches(res.domain || '', domain) : false;
    const bySkill = skillSetsOverlap(skills, required);
    if (!byDomain && !bySkill) continue;

    out.push({
      id: res.id,
      title: res.title,
      url: res.url,
      type: res.type || 'Course',
      difficulty: res.difficulty || 'Beginner',
      domain: res.domain || '',
      skills_covered: skills,
      matchReason: byDomain && bySkill ? 'both' : byDomain ? 'domain' : 'skill'
    });
  }

  return out.sort((a, b) => a.title.localeCompare(b.title));
}

/** Resources whose domain field matches the learning domain name. */
export function resourcesForDomain(resources: ResourceLike[], domainName: string): LinkedResource[] {
  const name = domainName.trim();
  if (!name) return [];

  return resources
    .filter((res) => domainMatches(res.domain || '', name))
    .map((res) => ({
      id: res.id,
      title: res.title,
      url: res.url,
      type: res.type || 'Course',
      difficulty: res.difficulty || 'Beginner',
      domain: res.domain || '',
      skills_covered: res.skills_covered || [],
      matchReason: 'domain' as const
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Resources that list this catalog skill in skills_covered. */
export function resourcesForSkill(resources: ResourceLike[], skillName: string): LinkedResource[] {
  const target = normLabel(normalizeSkill(skillName));
  if (!target) return [];

  return resources
    .filter((res) => {
      const skills = res.skills_covered || [];
      return skills.some((s) => normLabel(normalizeSkill(s)) === target);
    })
    .map((res) => ({
      id: res.id,
      title: res.title,
      url: res.url,
      type: res.type || 'Course',
      difficulty: res.difficulty || 'Beginner',
      domain: res.domain || '',
      skills_covered: res.skills_covered || [],
      matchReason: 'skill' as const
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function countLabel(n: number): string {
  if (n === 0) return 'None';
  if (n === 1) return '1 resource';
  return `${n} resources`;
}
