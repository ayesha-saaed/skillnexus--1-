import { supabase } from './supabase';
import { resources as staticResources } from './resources';
import { JOB_ROLES } from './knowledge_base';
import { readActivePathFromStorage } from './activePath';
import { resourcesForJobRole, type ResourceLike, type LinkedResource } from './resourceLinking';
import type { Resource } from '../types/database';

export type LibraryResource = Resource;

function mapDbRow(row: Record<string, unknown>): LibraryResource {
  return {
    id: String(row.id),
    title: String(row.title),
    description: (row.description as string) || '',
    url: String(row.url),
    type: (row.type as string) || 'Course',
    skillsCovered: (row.skills_covered as string[]) || [],
    platform: (row.platform as string) || 'Web',
    difficulty: (row.difficulty as string) || 'Beginner',
    domain: (row.domain as string) || 'General',
    rating: row.rating != null ? Number(row.rating) : null,
    duration: (row.duration as string) || null
  };
}

function toResourceLike(r: LibraryResource): ResourceLike {
  return {
    id: r.id,
    title: r.title,
    url: r.url,
    type: r.type,
    difficulty: r.difficulty,
    domain: r.domain,
    skills_covered: r.skillsCovered
  };
}

export type CareerPathContext = {
  roleName: string;
  domain: string;
  requiredSkills: string[];
  roleId?: string;
};

export async function fetchLibraryResources(): Promise<LibraryResource[]> {
  const byUrl = new Map<string, LibraryResource>();

  for (const r of staticResources) {
    byUrl.set(r.url.toLowerCase(), r);
  }

  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data?.length) {
      for (const row of data) {
        const mapped = mapDbRow(row as Record<string, unknown>);
        byUrl.set(mapped.url.toLowerCase(), mapped);
      }
    }
  } catch {
    /* use static fallback */
  }

  return Array.from(byUrl.values());
}

export async function resolveCareerPathContext(userId?: string): Promise<CareerPathContext | null> {
  const ls = readActivePathFromStorage();
  let roleName = ls.roleName?.trim() || '';
  let domain = ls.domain?.trim() || '';
  let roleId = ls.roleId;
  let requiredSkills: string[] = [];

  if (userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_job_role_id, active_job_role_name, active_path_domain')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        roleName = roleName || profile.active_job_role_name || '';
        domain = domain || profile.active_path_domain || '';
        roleId = roleId || profile.active_job_role_id || undefined;
      }
    } catch {
      /* optional columns */
    }
  }

  if (!roleName && !domain) return null;

  const gapSkills = [...(ls.missingSkills || []), ...(ls.weakSkills || [])];

  if (roleId && !roleId.startsWith('job-')) {
    const { data: role } = await supabase
      .from('job_roles')
      .select('role_name, domain, required_skills')
      .eq('id', roleId)
      .maybeSingle();
    if (role) {
      roleName = roleName || role.role_name || '';
      domain = domain || role.domain || '';
      requiredSkills = (role.required_skills as string[]) || [];
    }
  }

  if (!requiredSkills.length && roleName) {
    const { data: roleByName } = await supabase
      .from('job_roles')
      .select('id, role_name, domain, required_skills')
      .ilike('role_name', roleName)
      .maybeSingle();
    if (roleByName) {
      domain = domain || roleByName.domain || '';
      roleId = roleId || roleByName.id;
      requiredSkills = (roleByName.required_skills as string[]) || [];
    }
  }

  const kbRole = JOB_ROLES.find((r) => r.jobRole.trim().toLowerCase() === roleName.toLowerCase());
  if (kbRole) {
    domain = domain || kbRole.domain;
    const kbSkills = kbRole.requiredSkills.map((s) => s.name);
    requiredSkills = [...new Set([...requiredSkills, ...kbSkills])];
  }

  requiredSkills = [...new Set([...requiredSkills, ...gapSkills].filter(Boolean))];

  return {
    roleName: roleName || 'Your career path',
    domain: domain || 'General',
    requiredSkills,
    roleId
  };
}

export function splitResourcesByCareerPath(
  all: LibraryResource[],
  path: CareerPathContext | null
): { pathResources: LibraryResource[]; otherResources: LibraryResource[]; linked: LinkedResource[] } {
  if (!path || (!path.domain && !path.requiredSkills.length)) {
    return { pathResources: [], otherResources: all, linked: [] };
  }

  const linked = resourcesForJobRole(
    all.map(toResourceLike),
    { domain: path.domain, required_skills: path.requiredSkills }
  );
  const pathIds = new Set(linked.map((r) => r.id));
  const pathResources = linked
    .map((lr) => all.find((r) => r.id === lr.id))
    .filter((r): r is LibraryResource => Boolean(r));
  const otherResources = all.filter((r) => !pathIds.has(r.id));

  return { pathResources, otherResources, linked };
}

export function filterLibraryResources(
  resources: LibraryResource[],
  filters: { type: string; domain: string; difficulty: string }
): LibraryResource[] {
  return resources.filter((r) => {
    if (filters.type !== 'All' && r.type !== filters.type) return false;
    if (filters.domain !== 'All' && r.domain !== filters.domain) return false;
    if (filters.difficulty !== 'All' && r.difficulty !== filters.difficulty) return false;
    return true;
  });
}

export function groupResourcesByDomain(resources: LibraryResource[]): { domain: string; items: LibraryResource[] }[] {
  const map = new Map<string, LibraryResource[]>();
  for (const r of resources) {
    const key = r.domain?.trim() || 'General';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries())
    .map(([domain, items]) => ({ domain, items: items.sort((a, b) => a.title.localeCompare(b.title)) }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

export function groupResourcesByType(resources: LibraryResource[]): { type: string; items: LibraryResource[] }[] {
  const order = ['Documentation', 'Course', 'Video', 'Article', 'Practice Platform'];
  const map = new Map<string, LibraryResource[]>();
  for (const r of resources) {
    const key = r.type || 'Other';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  const keys = [...map.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return keys.map((type) => ({
    type,
    items: (map.get(type) || []).sort((a, b) => a.title.localeCompare(b.title))
  }));
}

export const RESOURCE_TYPES = ['All', 'Documentation', 'Course', 'Video', 'Article', 'Practice Platform'] as const;
