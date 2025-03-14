import { createSignal } from 'solid-js';
import auth from './auth';

export interface User {
  readonly firebase_user_id: string;
  readonly email: string;
  readonly display_name: string | null;
}

const [user, setUser] = createSignal<User | null>(null);
const [authError, setAuthError] = createSignal<string | null>(null);

const setUserAndAuthError = (
  newUser: User | null,
  newAuthError: string | null,
) => {
  setUser(newUser);
  setAuthError(newAuthError);
};

export { user, setUser, setUserAndAuthError, authError };

auth.onAuthStateChanged(async firebaseUser => {
  if (!firebaseUser) {
    setUser(null);
    return;
  }

  try {
    // Get an updated token. This will always happen whenever the user
    // is logged in or page reloads and Firebase sees a valid session.
    const token = await firebaseUser.getIdToken();

    // Set the token cookie so that your backend knows who you are
    document.cookie = `token=${token}; path=/; SameSite=None; Secure`;

    // Verify the login with your backend
    const response = await fetch('/api/verify_login', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const newUser: User = {
      firebase_user_id: firebaseUser.uid,
      email: firebaseUser.email || '',
      display_name: data.display_name,
    };

    setUserAndAuthError(newUser, null);
  } catch (error) {
    console.error('Error verifying login:', error);
    setUserAndAuthError(null, 'Error verifying login. You have been logged out.');
  }
});
