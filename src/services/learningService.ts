import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

export interface Progress {
  userId: string;
  resourceId: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
  timeSpent: number;
  lastUpdated: any;
}

export const learningService = {
  /**
   * Tracks user progress on a learning resource.
   */
  async updateProgress(userId: string, resourceId: string, updates: Partial<Progress>) {
    const progressRef = collection(db, 'progress');
    const q = query(progressRef, where('userId', '==', userId), where('resourceId', '==', resourceId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return await addDoc(progressRef, {
        userId,
        resourceId,
        status: updates.status || 'In Progress',
        progress: updates.progress || 0,
        timeSpent: updates.timeSpent || 0,
        lastUpdated: serverTimestamp()
      });
    } else {
      const docRef = doc(db, 'progress', snapshot.docs[0].id);
      return await updateDoc(docRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    }
  },

  /**
   * Fetches user progress for all resources.
   */
  async getUserProgress(userId: string) {
    const progressRef = collection(db, 'progress');
    const q = query(progressRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
