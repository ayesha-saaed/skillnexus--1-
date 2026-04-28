// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCIjtludEKcOWbEdu1Eb30amgO4S_cISXo",
  authDomain: "skill-nexus-58242.firebaseapp.com",
  projectId: "skill-nexus-58242",
  storageBucket: "skill-nexus-58242.firebasestorage.app",
  messagingSenderId: "894735543495",
  appId: "1:894735543495:web:0e131e7225a2e1214222e2",
  measurementId: "G-WF5XEVP1YK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (optional check for support as it can fail in some environments)
export let analytics: any = null;
isSupported().then(yes => {
  if (yes) analytics = getAnalytics(app);
});

/**
 * Enhanced Firestore Error Handling
 * Throws a JSON string of FirestoreErrorInfo as required by integration guidelines.
 */
export async function handleFirestoreError(error: any, operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write', path: string | null = null) {
  if (error?.message?.includes('Missing or insufficient permissions')) {
    const user = auth.currentUser;
    const errorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: user?.uid || 'unauthenticated',
        email: user?.email || 'unauthenticated',
        emailVerified: user?.emailVerified || false,
        isAnonymous: user?.isAnonymous || false,
        providerInfo: user?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
}

// Test Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore Connection: Stable");
  } catch (error: any) {
    console.warn("Firestore connection check:", error.message);
  }
}
testConnection();
