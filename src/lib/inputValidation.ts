/**
 * Shared validation for display names, skills, job roles, domains, badges, email, resources.
 */

/** 2–80 chars; first char letter, digit, or . + # */
export const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9.+#][a-zA-Z0-9\s\-+#.()/']{1,79}$/;

/** Job role / career title: 3–120 chars */
export const JOB_ROLE_TITLE_REGEX = /^[a-zA-Z0-9.+#][a-zA-Z0-9\s\-&,./()']{2,119}$/;

/** Domain / category labels */
export const DOMAIN_LABEL_REGEX = /^[a-zA-Z0-9.+#][a-zA-Z0-9\s\-&/,+.() ]{1,79}$/;

/** Resource / course titles */
export const RESOURCE_TITLE_REGEX = /^[a-zA-Z0-9.+#][a-zA-Z0-9\s\-&:,./()']{2,119}$/;

/** Gamification badge slugs (lowercase snake or single words) */
export const BADGE_TOKEN_REGEX = /^[a-z][a-z0-9_]{1,31}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export function isValidDisplayName(value: string): boolean {
  const t = value.trim();
  return t.length >= 2 && t.length <= 80 && DISPLAY_NAME_REGEX.test(t);
}

export function isValidSkillToken(s: string): boolean {
  return isValidDisplayName(s);
}

export function isValidJobRoleTitle(value: string): boolean {
  const t = value.trim();
  return t.length >= 3 && t.length <= 120 && JOB_ROLE_TITLE_REGEX.test(t);
}

export function isValidDomainLabel(value: string): boolean {
  const t = value.trim();
  return t.length >= 2 && t.length <= 80 && DOMAIN_LABEL_REGEX.test(t);
}

export function isValidResourceTitle(value: string): boolean {
  const t = value.trim();
  return t.length >= 3 && t.length <= 120 && RESOURCE_TITLE_REGEX.test(t);
}

export function isValidBadgeToken(token: string): boolean {
  const t = token.trim().toLowerCase();
  return t.length >= 2 && t.length <= 32 && BADGE_TOKEN_REGEX.test(t);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function validateCommaSeparatedSkills(
  input: string
): { ok: true; skills: string[] } | { ok: false; error: string } {
  const raw = input.trim();
  if (!raw) return { ok: true, skills: [] };
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    if (!isValidSkillToken(p)) {
      return {
        ok: false,
        error: `Invalid skill "${p}". Use 2–80 characters; start with a letter, number, or . + #.`
      };
    }
  }
  return { ok: true, skills: parts };
}

export function validateSkillNameList(
  skills: string[]
): { ok: true; skills: string[] } | { ok: false; error: string } {
  for (const p of skills) {
    if (!isValidSkillToken(p)) {
      return {
        ok: false,
        error: `Invalid skill "${p}". Use 2–80 characters; start with a letter, number, or . + #.`
      };
    }
  }
  return { ok: true, skills };
}

export function validateCommaSeparatedBadges(
  input: string
): { ok: true; badges: string[] } | { ok: false; error: string } {
  const raw = input.trim();
  if (!raw) return { ok: true, badges: [] };
  const parts = raw.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
  for (const p of parts) {
    if (!isValidBadgeToken(p)) {
      return {
        ok: false,
        error: `Invalid badge "${p}". Use 2–32 lowercase letters, numbers, and underscores (e.g. polymath, early_adopter).`
      };
    }
  }
  return { ok: true, badges: parts };
}
