import { onAuthStateChanged } from 'firebase/auth';
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

onAuthStateChanged(auth, firebaseUser => {
  if (firebaseUser) {
    const { uid, email } = firebaseUser;
    // the display name will be set when we verify the login
    setUser({ firebase_user_id: uid, email: email || '', display_name: null });
  } else {
    setUser(null);
  }
});
