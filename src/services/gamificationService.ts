import { supabase } from '../lib/supabase';


export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: Badge[] = [
  { id: 'nexus_pioneer', name: 'Nexus Pioneer', description: 'Initialized knowledge matrix for the first time.', icon: 'Sparkles' },
  { id: 'gap_finder', name: 'Gap Finder', description: 'Identified 5 critical skill gaps.', icon: 'Search' },
  { id: 'module_master', name: 'Module Master', description: 'Completed 5 learning resources.', icon: 'CheckCircle' },
  { id: 'polymath', name: 'Polymath', description: 'Reached Advanced proficiency in 3 different skills.', icon: 'Trophy' },
  { id: 'architect', name: 'Architect', description: 'Reached 1000 Nexus IQ points.', icon: 'ShieldCheck' }
];

export const gamificationService = {
  awardPoints: async (userId: string, amount: number, reason: string) => {
    try {
      const { data: userData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (userData) {
        const newPoints = (userData.points || 0) + amount;
        await supabase.from('profiles').update({
          points: newPoints,
          updated_at: new Date().toISOString()
        }).eq('id', userId);

        await supabase.from('leaderboard').upsert({
          userId,
          displayName: userData.name || 'Anonymous Architect',
          photoURL: userData.photoURL || '',
          points: newPoints,
          badgesCount: (userData.badges?.length || 0),
          lastUpdated: new Date().toISOString()
        });
        
        // Check for level up (every 500 points)
        const currentPoints = newPoints;
        const oldLevel = Math.floor((currentPoints - amount) / 500);
        const newLevel = Math.floor(currentPoints / 500);
        
        if (newLevel > oldLevel) {
           await supabase.from('profiles').update({ level: newLevel }).eq('id', userId);
        }

        // Check for Architect badge
        if (currentPoints >= 1000 && !userData.badges?.includes('architect')) {
           await gamificationService.awardBadge(userId, 'architect');
        }
      }
    } catch (err) {
      console.error("Failed to award points:", err);
    }
  },

  awardBadge: async (userId: string, badgeId: string) => {
    try {
      const { data: userData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (userData && !userData.badges?.includes(badgeId)) {
        const nextBadges = [...(userData.badges || []), badgeId];
        await supabase.from('profiles').update({
          badges: nextBadges,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
        
        // Update leaderboard badge count
        await supabase.from('leaderboard').upsert({
          userId,
          badgesCount: (userData.badges?.length || 0) + 1,
          lastUpdated: new Date().toISOString()
        });
        
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to award badge:", err);
      return false;
    }
  },

  getLeaderboard: async (count: number = 20) => {
    const { data, error } = await supabase.from('leaderboard').select('*').order('points', { ascending: false }).limit(count);
    if (error) throw error;
    return data || [];
  },

  async checkAchievements(userId: string, category: 'gaps' | 'resources' | 'skills') {
     const { data: userData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
     if (!userData) return;

     if (category === 'gaps') {
        const { count } = await supabase.from('user_skills').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        // For simplicity, let's just count total user skills added as "engagement"
        if ((count || 0) >= 5 && !userData.badges?.includes('gap_finder')) {
           await gamificationService.awardBadge(userId, 'gap_finder');
        }
     }

     if (category === 'resources') {
        // Find completed resources in Progress collection
        // Since progress is a top level collection with userId field
        // We'd need a query here. 
        // For this demo, let's assume we call this when completion happens.
     }
  }
};
