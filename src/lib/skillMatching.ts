import { DEFAULT_REQUIRED_PROFICIENCY, PROFICIENCY_SCORES } from './knowledge_base';
import { normalizeSkill } from './skillNormalization';

/** Stable key for comparing skill names (case, spaces, synonyms). */
export function skillMatchKey(name: string): string {
  return normalizeSkill(name).trim().toLowerCase().replace(/\s+/g, ' ');
}

export function skillsAreEqual(a: string, b: string): boolean {
  return skillMatchKey(a) === skillMatchKey(b);
}

export type UserSkillLike = { name: string; proficiency?: string | null };

export function findUserSkillForRequired<T extends UserSkillLike>(
  userSkills: T[],
  requiredName: string
): T | undefined {
  const key = skillMatchKey(requiredName);
  return userSkills.find((s) => skillMatchKey(s.name) === key);
}

export function proficiencyToScore(proficiency?: string | null): number {
  if (!proficiency) return 0;
  const t = proficiency.trim();
  return PROFICIENCY_SCORES[t] ?? 0;
}

export interface RequiredSkillInput {
  name: string;
  importance: number;
  requiredProficiency: number;
}

export interface GapChartRow {
  skill: string;
  yourScore: number;
  required: number;
  status: 'matched' | 'weak' | 'missing';
  importance: number;
}

export interface GapAnalysisResult {
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: { name: string; gap: number }[];
  matchPercent: number;
  chartData: GapChartRow[];
}

/**
 * Compare user skills to job-role requirements with normalized names and proficiency scoring.
 */
export function computeGapAnalysis(
  userSkills: UserSkillLike[],
  requiredSkills: RequiredSkillInput[]
): GapAnalysisResult {
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const weakSkills: { name: string; gap: number }[] = [];
  let totalImportance = 0;
  let weightedScore = 0;

  const chartData: GapChartRow[] = [];

  for (const req of requiredSkills) {
    totalImportance += req.importance;
    const userSkill = findUserSkillForRequired(userSkills, req.name);
    const userScore = userSkill ? proficiencyToScore(userSkill.proficiency) : 0;
    const required = req.requiredProficiency ?? DEFAULT_REQUIRED_PROFICIENCY;
    const scoreRatio = required > 0 ? userScore / required : 0;

    let status: GapChartRow['status'] = 'missing';

    if (userSkill) {
      if (userScore >= required) {
        matchedSkills.push(req.name);
        weightedScore += req.importance * 1;
        status = 'matched';
      } else {
        weakSkills.push({ name: req.name, gap: required - userScore });
        weightedScore += req.importance * scoreRatio;
        status = 'weak';
      }
    } else {
      missingSkills.push(req.name);
      status = 'missing';
    }

    chartData.push({
      skill: req.name,
      yourScore: userScore,
      required,
      status,
      importance: req.importance
    });
  }

  const matchPercent =
    totalImportance > 0 ? Math.round((weightedScore / totalImportance) * 100) : 0;

  weakSkills.sort(
    (a, b) =>
      (requiredSkills.find((r) => skillsAreEqual(r.name, a.name))?.importance || 0) -
      (requiredSkills.find((r) => skillsAreEqual(r.name, b.name))?.importance || 0)
  );

  return {
    matchedSkills,
    missingSkills,
    weakSkills,
    matchPercent,
    chartData: chartData.slice(0, 10)
  };
}
