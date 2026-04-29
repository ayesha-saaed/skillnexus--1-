import { supabase } from './firebase';

const LS = {
  roleId: 'skillnexus.activeJobRoleId',
  roleName: 'skillnexus.activeJobRoleName',
  domain: 'skillnexus.activePathDomain',
  missingSkills: 'skillnexus.activeMissingSkills',
  weakSkills: 'skillnexus.activeWeakSkills',
} as const;

export const ACTIVE_PATH_EVENT = 'skillnexus:active-path';

export type ActivePathPayload = {
  id?: string;
  roleName: string;
  domain: string;
  missingSkills?: string[];
  weakSkills?: string[];
};

export function readActivePathFromStorage(): ActivePathPayload & { roleId?: string } {
  if (typeof window === 'undefined') {
    return { roleName: '', domain: '' };
  }
  const id = localStorage.getItem(LS.roleId) || undefined;
  const roleName = localStorage.getItem(LS.roleName) || '';
  const domain = localStorage.getItem(LS.domain) || '';
  const missingSkillsRaw = localStorage.getItem(LS.missingSkills);
  const weakSkillsRaw = localStorage.getItem(LS.weakSkills);
  const missingSkills = missingSkillsRaw ? JSON.parse(missingSkillsRaw) : [];
  const weakSkills = weakSkillsRaw ? JSON.parse(weakSkillsRaw) : [];
  return { id, roleName, domain, missingSkills, weakSkills };
}

export function persistActivePath(role: ActivePathPayload, userId: string) {
  if (typeof window === 'undefined') return;
  if (role.id) localStorage.setItem(LS.roleId, role.id);
  else localStorage.removeItem(LS.roleId);
  localStorage.setItem(LS.roleName, role.roleName || '');
  localStorage.setItem(LS.domain, role.domain || '');
  if (role.missingSkills) localStorage.setItem(LS.missingSkills, JSON.stringify(role.missingSkills));
  else localStorage.removeItem(LS.missingSkills);
  if (role.weakSkills) localStorage.setItem(LS.weakSkills, JSON.stringify(role.weakSkills));
  else localStorage.removeItem(LS.weakSkills);
  window.dispatchEvent(new CustomEvent(ACTIVE_PATH_EVENT, { detail: role }));

  void supabase
    .from('profiles')
    .update({
      active_job_role_id: role.id ?? null,
      active_job_role_name: role.roleName || null,
      active_path_domain: role.domain || null,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', userId);
}
