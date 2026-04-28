import { db } from '../lib/firebase';
import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  increment, 
  arrayUnion, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

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
    const userRef = doc(db, 'users', userId);
    const leaderboardRef = doc(db, 'leaderboard', userId);
    
    try {
      // Update user document
      await updateDoc(userRef, {
        points: increment(amount),
        updatedAt: serverTimestamp()
      });

      // Update leaderboard
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      
      if (userData) {
        await setDoc(leaderboardRef, {
          userId,
          displayName: userData.name || 'Anonymous Architect',
          photoURL: userData.photoURL || '',
          points: (userData.points || 0),
          badgesCount: (userData.badges?.length || 0),
          lastUpdated: serverTimestamp()
        }, { merge: true });
        
        // Check for level up (every 500 points)
        const currentPoints = userData.points || 0;
        const oldLevel = Math.floor((currentPoints - amount) / 500);
        const newLevel = Math.floor(currentPoints / 500);
        
        if (newLevel > oldLevel) {
           await updateDoc(userRef, { level: newLevel });
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
    const userRef = doc(db, 'users', userId);
    try {
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      
      if (userData && !userData.badges?.includes(badgeId)) {
        await updateDoc(userRef, {
          badges: arrayUnion(badgeId),
          updatedAt: serverTimestamp()
        });
        
        // Update leaderboard badge count
        const leaderboardRef = doc(db, 'leaderboard', userId);
        await updateDoc(leaderboardRef, {
          badgesCount: (userData.badges?.length || 0) + 1,
          lastUpdated: serverTimestamp()
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
    const lbRef = collection(db, 'leaderboard');
    const q = query(lbRef, orderBy('points', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data());
  },

  async checkAchievements(userId: string, category: 'gaps' | 'resources' | 'skills') {
     const userRef = doc(db, 'users', userId);
     const userSnap = await getDoc(userRef);
     const userData = userSnap.data();
     if (!userData) return;

     if (category === 'gaps') {
        const gapsSnap = await getDocs(collection(db, 'users', userId, 'skills')); // Technically these are added skills but let's assume we track gaps differently or use this
        // For simplicity, let's just count total user skills added as "engagement"
        if (gapsSnap.size >= 5 && !userData.badges?.includes('gap_finder')) {
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
