export type UUID = string;

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ProfileRow {
  id: UUID;
  email: string | null;
  name: string | null;
  role: string;
  points: number;
  level: number;
  badges: string[];
  created_at: string;
  updated_at: string;
}

export interface UserSkillRow {
  id: UUID;
  user_id: UUID;
  skill_name: string;
  proficiency: SkillProficiency;
  updated_at: string;
}

export interface JobRoleRow {
  id: UUID;
  role_name: string;
  required_skills: string[];
  difficulty: string;
  domain: string;
  created_at: string;
}

export interface ResourceRow {
  id: UUID;
  title: string;
  description: string | null;
  url: string;
  type: string;
  skills_covered: string[];
  difficulty: string;
  platform: string;
  duration: string | null;
  rating: number | null;
  domain: string;
  created_at: string;
  review_status?: ReviewStatus | null;
  source?: string | null;
  quality_score?: number | null;
  freshness_score?: number | null;
  deleted_at?: string | null;
  deleted_by?: UUID | null;
  created_by?: UUID | null;
  updated_by?: UUID | null;
}

export interface Resource {
  id: UUID;
  title: string;
  description: string | null;
  url: string;
  type: string;
  skillsCovered: string[];
  difficulty: string;
  platform: string;
  duration: string | null;
  rating: number | null;
  domain: string;
}

export interface TrendRow {
  id: UUID;
  skill_name: string;
  demand_score: number;
  growth: string | null;
  created_at: string;
}

export interface ProgressRow {
  id: UUID;
  user_id: UUID;
  resource_id: UUID;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
  time_spent: number;
  last_updated: string;
}

export interface Progress {
  userId: UUID;
  resourceId: UUID;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
  timeSpent: number;
  lastUpdated: string;
}
