import firebaseConfig from './firebaseConfig';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// This handles automatic refreshes to the token.
auth.onIdTokenChanged(async user => {
  if (user) {
    try {
      const token = await user.getIdToken();
      // Update the token cookie
      document.cookie = 'token=' + token + '; path=/; SameSite=None; Secure';
    } catch (error) {
      console.error('Error getting ID token:', error);
    }
  } else {
    // User is signed out; clear the token cookie
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure';
  }
});

export default auth;
