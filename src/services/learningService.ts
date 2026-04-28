import { supabase } from '../lib/firebase';

export interface Progress {
  user_id: string;
  resource_id: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
  time_spent: number;
  last_updated: any;
  [key: string]: any;
}

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
      time_spent: updates.timeSpent || 0,
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
    const { data, error } = await supabase.from('progress').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      userId: row.user_id,
      resourceId: row.resource_id,
      timeSpent: row.time_spent,
      lastUpdated: row.last_updated
    }));
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
  }
};
