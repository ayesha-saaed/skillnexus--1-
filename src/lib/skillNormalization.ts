import { SYNONYMS } from './knowledge_base';

export function normalizeSkill(skillName: string) {
  const normalized = skillName.trim().toLowerCase();
  for (const item of SYNONYMS) {
    if (item.skill.toLowerCase() === normalized) return item.skill;
    if (item.synonyms.some((synonym: string) => synonym.toLowerCase() === normalized)) {
      return item.skill;
    }
  }
  return skillName.trim();
}

export function canonicalizeSkills(skills: string[]) {
  return skills.map((skill) => normalizeSkill(skill)).filter(Boolean);
}
