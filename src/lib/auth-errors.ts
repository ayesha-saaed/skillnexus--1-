/**
 * Centralized Firebase Auth Error Handler
 * Maps Firebase error codes to user-friendly, actionable messages.
 */

export interface AuthErrorInfo {
  code: string;
  message: string;
  action: string;
  isConfigError: boolean;
}

const AUTH_ERROR_MAP: Record<string, Omit<AuthErrorInfo, 'code'>> = {
  'auth/configuration-not-found': {
    message: 'Firebase Authentication is not configured for this project.',
    action: 'Please go to the Firebase Console → Authentication → Sign-in method, and enable Email/Password and Google providers. Then try again.',
    isConfigError: true,
  },
  'auth/invalid-api-key': {
    message: 'The Firebase API key is invalid or restricted.',
    action: 'Check your firebase-applet-config.json and ensure the API key is correct and not restricted to specific APIs or domains.',
    isConfigError: true,
  },
  'auth/network-request-failed': {
    message: 'A network error occurred while trying to reach Firebase.',
    action: 'Check your internet connection. If you are offline, enable the Firebase Auth Emulator or wait for connectivity to return.',
    isConfigError: false,
  },
  'auth/invalid-email': {
    message: 'The email address is not valid.',
    action: 'Please enter a valid email address.',
    isConfigError: false,
  },
  'auth/user-disabled': {
    message: 'This user account has been disabled.',
    action: 'Contact support or your administrator for assistance.',
    isConfigError: false,
  },
  'auth/user-not-found': {
    message: 'No user found with this email address.',
    action: 'Please register first or check your email for typos.',
    isConfigError: false,
  },
  'auth/wrong-password': {
    message: 'The password is incorrect.',
    action: 'Please try again or reset your password.',
    isConfigError: false,
  },
  'auth/email-already-in-use': {
    message: 'An account already exists with this email.',
    action: 'Please log in instead or use a different email address.',
    isConfigError: false,
  },
  'auth/weak-password': {
    message: 'The password is too weak.',
    action: 'Please use a stronger password with at least 6 characters.',
    isConfigError: false,
  },
  'auth/popup-closed-by-user': {
    message: 'The sign-in popup was closed before completion.',
    action: 'Please try again and complete the sign-in process.',
    isConfigError: false,
  },
  'auth/popup-blocked': {
    message: 'The sign-in popup was blocked by the browser.',
    action: 'Please allow popups for this site and try again.',
    isConfigError: false,
  },
  'auth/cancelled-popup-request': {
    message: 'Multiple popup requests were triggered.',
    action: 'Please try again with a single click.',
    isConfigError: false,
  },
  'auth/unauthorized-domain': {
    message: 'This domain is not authorized for OAuth operations.',
    action: 'Add this domain to the authorized domains list in Firebase Console → Authentication → Settings → Authorized domains.',
    isConfigError: true,
  },
};

export function parseAuthError(error: any): AuthErrorInfo {
  const code: string = error?.code || 'auth/unknown';
  const mapped = AUTH_ERROR_MAP[code];

  if (mapped) {
    return { code, ...mapped };
  }

  // Fallback for unmapped errors
  return {
    code,
    message: error?.message || 'An unexpected authentication error occurred.',
    action: 'Please try again. If the problem persists, check the browser console for details.',
    isConfigError: false,
  };
}

/**
 * Returns true if the error is a known configuration-level issue
 * that requires Firebase Console changes.
 */
export function isAuthConfigError(error: any): boolean {
  const { isConfigError } = parseAuthError(error);
  return isConfigError;
}

