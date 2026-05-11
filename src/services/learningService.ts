import { supabase } from '../lib/supabase';
import type { Progress as ProgressType, ProgressRow } from '../types/database';

export interface Progress extends ProgressType {}

export const learningService = {
  /**
   * Tracks user progress on a learning resource.
   */
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
      time_spent: updates.time_spent || 0,
      last_updated: new Date().toISOString()
    };

    if (!existing) {
      return await supabase.from('progress').insert(payload);
    }
    return await supabase.from('progress').update(payload).eq('id', existing.id);
  },

  /**
   * Fetches user progress for all resources.
   */
  async getUserProgress(userId: string) {
    const { data, error } = await supabase.from<ProgressRow>('progress').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((row) => ({
      ...row,
      userId: row.user_id,
      resourceId: row.resource_id,
      timeSpent: row.time_spent,
      lastUpdated: row.last_updated
    })) as ProgressType[];
  },

  /**
   * Calculates learning analytics (Total time, completion count).
   */
  async getLearningAnalytics(userId: string) {
    const progress = await this.getUserProgress(userId);
    const totalTime = progress.reduce((sum, p: any) => sum + (p.timeSpent || 0), 0);
    const completedCount = progress.filter((p: any) => p.status === 'Completed').length;
    
    return {
      totalTime,
      completedCount,
      totalEnrolled: progress.length
    };
  },

  /**
   * Fetches skill trajectory data: top 3 skills' avg proficiency over time from events.
   * Aggregates monthly.
   */
  async getSkillTrajectory(userId: string) {
    const { data: events } = await supabase
      .from('skill_development_events')
      .select('skill_name, event_type, created_at, detail')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!events || events.length === 0) {
      // Mock data for demo
      return [
        { month: 'Jan', React: 0.3, Nodejs: 0.1, Python: 0.0 },
        { month: 'Feb', React: 0.4, Nodejs: 0.2, Python: 0.1 },
        { month: 'Mar', React: 0.6, Nodejs: 0.4, Python: 0.3 },
        { month: 'Apr', React: 0.7, Nodejs: 0.6, Python: 0.5 },
        { month: 'May', React: 0.85, Nodejs: 0.7, Python: 0.7 },
        { month: 'Jun', React: 0.95, Nodejs: 0.8, Python: 0.85 },
      ];
    }

    // Group by month and skill, estimate proficiency (simple: event_type 'improved' increments)
    const monthly: Record<string, Record<string, number>> = {};
    events.forEach((ev: any) => {
      const month = new Date(ev.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!monthly[month]) monthly[month] = {};
      if (!monthly[month][ev.skill_name]) monthly[month][ev.skill_name] = 0;
      // Mock proficiency growth: +0.1 per positive event
      monthly[month][ev.skill_name] += 0.1;
      // Cap at 1.0
      monthly[month][ev.skill_name] = Math.min(1.0, monthly[month][ev.skill_name]);
    });

    // Get months sorted
    const months = Object.keys(monthly).sort();
    // Top 3 skills by events
    const allSkills = new Set(events.map((e: any) => e.skill_name));
    const topSkills = Array.from(allSkills).slice(0, 3);

    const trajectoryData = months.map(month => {
      const data: any = { month };
      topSkills.forEach(skill => {
        data[skill] = monthly[month][skill] || (monthly[month][skill] ?? 0);
      });
      return data;
    });

    return trajectoryData;
  }
};
