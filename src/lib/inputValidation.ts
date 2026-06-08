/**
 * Shared validation for display names, skills, job roles, domains, badges, email, resources, profiles.
 */

/** Skill / catalog name: 2–80 chars; start with letter or . + #; must include a letter */
export const DISPLAY_NAME_REGEX = /^[a-zA-Z.+#][a-zA-Z0-9\s\-+#.()/']{1,79}$/;

/** Job role / career title: 3–120 chars; must include a letter */
export const JOB_ROLE_TITLE_REGEX = /^[a-zA-Z0-9.+#][a-zA-Z0-9\s\-&,./()']{2,119}$/;

/** Domain / category: 2–80 chars; must start with a letter and include a letter */
export const DOMAIN_LABEL_REGEX = /^[a-zA-Z][a-zA-Z0-9\s\-&/,+.() ]{1,79}$/;

/** Resource / course titles: 3–120 chars; must include a letter */
export const RESOURCE_TITLE_REGEX = /^[a-zA-Z][a-zA-Z0-9\s\-&:,./()']{2,119}$/;

/** Resource description: plain text, no control chars */
export const RESOURCE_DESCRIPTION_REGEX = /^[\s\S]{10,2000}$/;

/** Gamification badge slugs (lowercase snake or single words) */
export const BADGE_TOKEN_REGEX = /^[a-z][a-z0-9_]{1,31}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const PROFILE_ROLES = ['student', 'admin', 'moderator'] as const;
export type ProfileRole = (typeof PROFILE_ROLES)[number];

export const RESOURCE_TYPES = ['Documentation', 'Course', 'Video', 'Article', 'Practice Platform'] as const;
export const RESOURCE_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export const MSG_SKILL =
  'Enter a real skill name (2–80 characters, start with a letter or . + #, include at least one letter — not only numbers).';
export const MSG_DOMAIN =
  'Enter a real domain name (2–80 characters, start with a letter, include at least one letter — not only numbers).';
export const MSG_JOB_ROLE =
  'Enter a real job role title (3–120 characters, include at least one letter — not only numbers).';
export const MSG_RESOURCE_TITLE =
  'Enter a real title (3–120 characters, start with a letter, include at least one letter).';
export const MSG_DESCRIPTION = 'Description must be 10–2000 characters with no control characters.';

export function containsLetter(value: string): boolean {
  return /[a-zA-Z]/.test(value);
}

function passesLabelRules(
  value: string,
  minLen: number,
  maxLen: number,
  pattern: RegExp,
  requireLetter = true
): boolean {
  const t = value.trim();
  if (t.length < minLen || t.length > maxLen) return false;
  if (!pattern.test(t)) return false;
  if (requireLetter && !containsLetter(t)) return false;
  return true;
}

export function isValidDisplayName(value: string): boolean {
  return passesLabelRules(value, 2, 80, DISPLAY_NAME_REGEX, true);
}

export function isValidSkillToken(s: string): boolean {
  return isValidDisplayName(s);
}

export function isValidJobRoleTitle(value: string): boolean {
  return passesLabelRules(value, 3, 120, JOB_ROLE_TITLE_REGEX, true);
}

export function isValidDomainLabel(value: string): boolean {
  return passesLabelRules(value, 2, 80, DOMAIN_LABEL_REGEX, true);
}

export function isValidResourceTitle(value: string): boolean {
  return passesLabelRules(value, 3, 120, RESOURCE_TITLE_REGEX, true);
}

export function isValidResourceDescription(value: string): boolean {
  const t = value.trim();
  if (t.length < 10 || t.length > 2000) return false;
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(t)) return false;
  if (!containsLetter(t)) return false;
  return RESOURCE_DESCRIPTION_REGEX.test(t);
}

export function domainLabelError(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Domain name is required';
  if (!isValidDomainLabel(t)) return MSG_DOMAIN;
  return null;
}

export function skillTokenError(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Skill name is required';
  if (!isValidSkillToken(t)) return MSG_SKILL;
  return null;
}

export function jobRoleTitleError(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Role title is required';
  if (!isValidJobRoleTitle(t)) return MSG_JOB_ROLE;
  return null;
}

export function resourceTitleError(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Title is required';
  if (!isValidResourceTitle(t)) return MSG_RESOURCE_TITLE;
  return null;
}

export function resourceDescriptionError(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Description is required';
  if (!isValidResourceDescription(t)) return MSG_DESCRIPTION;
  return null;
}

export function isValidHttpUrl(value: string): boolean {
  const t = value.trim();
  if (!t || t.length > 2048) return false;
  try {
    const u = new URL(t);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Blocks internal placeholder URLs that are not real course pages. */
export function isPlaceholderResourceUrl(value: string): boolean {
  const t = value.trim().toLowerCase();
  if (!t) return false;
  try {
    const host = new URL(t).hostname.replace(/^www\./, '');
    if (host === 'skillnexus.dev' || host.endsWith('.skillnexus.dev')) {
      return t.includes('/learn/') || t.includes('localhost');
    }
  } catch {
    return false;
  }
  return false;
}

export function isValidBadgeToken(token: string): boolean {
  const t = token.trim().toLowerCase();
  return t.length >= 2 && t.length <= 32 && BADGE_TOKEN_REGEX.test(t);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value);
}

export function normalizeProfileRole(role: unknown): ProfileRole {
  const r = String(role ?? '')
    .trim()
    .toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'moderator') return 'moderator';
  return 'student';
}

export function isValidProfileRole(role: string): boolean {
  const n = normalizeProfileRole(role);
  return PROFILE_ROLES.includes(n);
}

export function isAdminRole(role: unknown): boolean {
  return normalizeProfileRole(role) === 'admin';
}

export function isValidResourceType(value: string): boolean {
  return (RESOURCE_TYPES as readonly string[]).includes(value);
}

export function isValidResourceDifficulty(value: string): boolean {
  return (RESOURCE_DIFFICULTIES as readonly string[]).includes(value);
}

export function isValidProficiency(value: string): boolean {
  return (PROFICIENCY_LEVELS as readonly string[]).includes(value);
}

export function validateCommaSeparatedSkills(
  input: string
): { ok: true; skills: string[] } | { ok: false; error: string } {
  const raw = input.trim();
  if (!raw) return { ok: true as const, skills: [] };
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    const err = skillTokenError(p);
    if (err) {
      return { ok: false as const, error: `Invalid skill "${p}". ${MSG_SKILL}` };
    }
  }
  return { ok: true as const, skills: parts };
}

export function validateSkillNameList(
  skills: string[]
): { ok: true; skills: string[] } | { ok: false; error: string } {
  for (const p of skills) {
    const err = skillTokenError(p);
    if (err) {
      return { ok: false as const, error: `Invalid skill "${p}". ${MSG_SKILL}` };
    }
  }
  return { ok: true as const, skills };
}

export function validateCommaSeparatedBadges(
  input: string
): { ok: true; badges: string[] } | { ok: false; error: string } {
  const raw = input.trim();
  if (!raw) return { ok: true as const, badges: [] };
  const parts = raw.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
  for (const p of parts) {
    if (!isValidBadgeToken(p)) {
      return {
        ok: false as const,
        error: `Invalid badge "${p}". Use 2–32 lowercase letters, numbers, and underscores (e.g. polymath, early_adopter).`
      };
    }
  }
  return { ok: true as const, badges: parts };
}

export function commaSeparatedSkillsValidationError(input: string): string | null {
  const result = validateCommaSeparatedSkills(input);
  if ('error' in result) return result.error;
  return null;
}

export function commaSeparatedBadgesValidationError(input: string): string | null {
  const result = validateCommaSeparatedBadges(input);
  if ('error' in result) return result.error;
  return null;
}
