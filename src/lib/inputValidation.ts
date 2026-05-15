/**
 * Shared patterns for display names, skill tags, job role titles, and domain labels.
 * Used client-side before writes; align with product expectations (no empty / garbage strings).
 */

/** 2–80 chars; first char letter, digit, or . + # (covers ".NET", "C++" style names). */
export const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9.+#][a-zA-Z0-9\s\-+#.()/']{1,79}$/;

/** Job role / career title: 3–120 chars, similar charset with comma and ampersand. */
export const JOB_ROLE_TITLE_REGEX = /^[a-zA-Z0-9.+#][a-zA-Z0-9\s\-&,./()']{2,119}$/;

/** Domain / category labels (admin domains & job role domain field). */
export const DOMAIN_LABEL_REGEX = /^[a-zA-Z0-9.+#][a-zA-Z0-9\s\-&/,+.() ]{1,79}$/;

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
        error: `Invalid skill "${p}". Use 2–80 characters; start with a letter, number, or . + #; then letters, numbers, spaces, and -+#.() and apostrophe (').`
      };
    }
  }
  return { ok: true, skills: parts };
}
