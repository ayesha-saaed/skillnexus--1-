import { supabase } from '../lib/supabase';
import { mapSnakeToCamel } from '../lib/utils';
import type { Progress as ProgressType } from '../types/database';

export interface Progress extends ProgressType {}

export type LearningActivityKind = 'resource' | 'skill';

export interface LearningActivityItem {
  id: string;
  kind: LearningActivityKind;
  title: string;
  subtitle: string;
  timestamp: string;
  progressPercent?: number;
  status?: string;
}

export interface LearningSummary {
  completedCount: number;
  inProgressCount: number;
  totalEnrolled: number;
  totalTime: number;
  skillsCount: number;
  completionRate: number;
}

export interface LearningTrack {
  summary: LearningSummary;
  recentActivity: LearningActivityItem[];
  recentProgress: LearningActivityItem[];
  recentSkillEvents: LearningActivityItem[];
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function mapProgressRow(row: Record<string, unknown>): LearningActivityItem {
  const resource = row.resources as { title?: string; type?: string } | null;
  const title = resource?.title || 'Learning resource';
  const status = String(row.status || 'Not Started');
  const progressPercent = typeof row.progress === 'number' ? row.progress : 0;
  const timeSpent = typeof row.time_spent === 'number' ? row.time_spent : 0;
  const ts = String(row.last_updated || new Date().toISOString());

  let subtitle = status;
  if (status === 'Completed') subtitle = 'Completed';
  else if (status === 'In Progress') subtitle = `${progressPercent}% complete · ${timeSpent} min`;
  else subtitle = resource?.type ? `${resource.type} · ${status}` : status;

  return {
    id: `progress-${row.id}`,
    kind: 'resource',
    title,
    subtitle,
    timestamp: ts,
    progressPercent,
    status
  };
}

function mapSkillEvent(row: Record<string, unknown>): LearningActivityItem {
  const skillName = String(row.skill_name || 'Skill');
  const eventType = String(row.event_type || 'added');
  const detail = (row.detail as Record<string, unknown>) || {};
  const ts = String(row.created_at || new Date().toISOString());

  let subtitle = 'Skill activity';
  if (eventType === 'added') {
    const prof = detail.proficiency ? ` · ${detail.proficiency}` : '';
    subtitle = `Added to your profile${prof}`;
  } else if (eventType === 'deleted') {
    subtitle = 'Removed from your profile';
  } else if (eventType === 'updated') {
    subtitle = detail.proficiency ? `Proficiency → ${detail.proficiency}` : 'Proficiency updated';
  }

  return {
    id: `skill-event-${row.id}`,
    kind: 'skill',
    title: skillName,
    subtitle,
    timestamp: ts
  };
}

function mapUserSkillRow(row: Record<string, unknown>): LearningActivityItem {
  const skillName = String(row.skill_name || 'Skill');
  const proficiency = String(row.proficiency || 'Beginner');
  return {
    id: `user-skill-${row.id}`,
    kind: 'skill',
    title: skillName,
    subtitle: `${proficiency} · on your profile`,
    timestamp: String(row.updated_at || new Date().toISOString())
  };
}

function mergeActivity(items: LearningActivityItem[], limit: number): LearningActivityItem[] {
  return [...items]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export const learningService = {
  async updateProgress(userId: string, resourceId: string, updates: Partial<Progress>) {
    const { data: existing } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .maybeSingle();

    const payload = {
      user_id: userId,
      resource_id: resourceId,
      status: updates.status || 'In Progress',
      progress: updates.progress || 0,
      time_spent: updates.timeSpent || 0,
      last_updated: new Date().toISOString()
    };

    if (!existing) {
      return await supabase.from('progress').insert(payload);
    }
    return await supabase.from('progress').update(payload).eq('id', existing.id);
  },

  async getUserProgress(userId: string) {
    const { data, error } = await supabase.from('progress').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((row) => {
      const mapped = mapSnakeToCamel(row) as Record<string, unknown>;
      return {
        userId: mapped.userId as string,
        resourceId: mapped.resourceId as string,
        status: mapped.status as ProgressType['status'],
        progress: mapped.progress as number,
        timeSpent: mapped.timeSpent as number,
        lastUpdated: mapped.lastUpdated as string
      } as ProgressType;
    });
  },

  async getLearningAnalytics(userId: string) {
    const progress = await this.getUserProgress(userId);
    const totalTime = progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const completedCount = progress.filter((p) => p.status === 'Completed').length;
    const inProgressCount = progress.filter((p) => p.status === 'In Progress').length;

    return {
      totalTime,
      completedCount,
      inProgressCount,
      totalEnrolled: progress.length
    };
  },

  async getLearningTrack(userId: string): Promise<LearningTrack> {
    const [progressRes, eventsRes, skillsRes] = await Promise.all([
      supabase
        .from('progress')
        .select('id, status, progress, time_spent, last_updated, resource_id, resources(title, type)')
        .eq('user_id', userId)
        .order('last_updated', { ascending: false })
        .limit(12),
      supabase
        .from('skill_development_events')
        .select('id, skill_name, event_type, detail, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('user_skills')
        .select('id, skill_name, proficiency, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(12)
    ]);

    const progressRows = (progressRes.data || []) as Record<string, unknown>[];
    const recentProgress = progressRows.map(mapProgressRow);

    let recentSkillEvents: LearningActivityItem[] = [];
    if (!eventsRes.error && (eventsRes.data || []).length > 0) {
      recentSkillEvents = (eventsRes.data || []).map((row) =>
        mapSkillEvent(row as Record<string, unknown>)
      );
    } else if (!skillsRes.error && (skillsRes.data || []).length > 0) {
      recentSkillEvents = (skillsRes.data || []).map((row) =>
        mapUserSkillRow(row as Record<string, unknown>)
      );
    }

    const skillsCount = skillsRes.data?.length ?? 0;
    const completedCount = recentProgress.filter((p) => p.status === 'Completed').length;
    const inProgressCount = recentProgress.filter((p) => p.status === 'In Progress').length;
    const totalEnrolled = progressRows.length;
    const totalTime = progressRows.reduce(
      (sum, row) => sum + (typeof row.time_spent === 'number' ? row.time_spent : 0),
      0
    );

    const allProgress = await this.getUserProgress(userId).catch(() => []);
    const fullCompleted = allProgress.filter((p) => p.status === 'Completed').length;
    const fullEnrolled = allProgress.length;
    const fullTime = allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const fullInProgress = allProgress.filter((p) => p.status === 'In Progress').length;

    const { count: skillsTotal } = await supabase
      .from('user_skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const summary: LearningSummary = {
      completedCount: fullCompleted,
      inProgressCount: fullInProgress,
      totalEnrolled: fullEnrolled,
      totalTime: fullTime,
      skillsCount: skillsTotal ?? skillsCount,
      completionRate: fullEnrolled > 0 ? Math.round((fullCompleted / fullEnrolled) * 100) : 0
    };

    const recentActivity = mergeActivity([...recentProgress, ...recentSkillEvents], 6);

    return {
      summary,
      recentActivity,
      recentProgress: recentProgress.slice(0, 4),
      recentSkillEvents: recentSkillEvents.slice(0, 4)
    };
  },

  async getSkillTrajectory(userId: string) {
    const { data: events } = await supabase
      .from('skill_development_events')
      .select('skill_name, event_type, created_at, detail')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!events || events.length === 0) {
      return [];
    }

    const monthly: Record<string, Record<string, number>> = {};
    events.forEach((ev: { skill_name: string; created_at: string }) => {
      const month = new Date(ev.created_at).toISOString().slice(0, 7);
      if (!monthly[month]) monthly[month] = {};
      if (!monthly[month][ev.skill_name]) monthly[month][ev.skill_name] = 0;
      monthly[month][ev.skill_name] += 0.1;
      monthly[month][ev.skill_name] = Math.min(1.0, monthly[month][ev.skill_name]);
    });

    const months = Object.keys(monthly).sort();
    const allSkills = new Set(events.map((e) => e.skill_name));
    const topSkills = Array.from(allSkills).slice(0, 3);

    return months.map((month) => {
      const data: Record<string, string | number> = { month };
      topSkills.forEach((skill) => {
        data[skill] = monthly[month][skill] ?? 0;
      });
      return data;
    });
  }
};
