import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import auth from './auth';
import { setUserAndAuthError } from './authSignal';
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(_event: MouseEvent) {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential) {
      console.error('Credential was null');
      setUserAndAuthError(null, 'Error signing in with Google. No credential');
      return;
    }

    const user = result.user;

    if (user) {
      // Get the token directly after sign-in
      const token = await user.getIdToken();

      // Set the token cookie
      document.cookie = 'token=' + token + '; path=/; SameSite=None; Secure';

      // Now call verify_login
      fetch('/api/verify_login', { credentials: 'include' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(_data => {
          console.log('Verified login');
          const newUser = {
            firebase_user_id: user.uid,
            email: user.email || '',
          };
          setUserAndAuthError(newUser, null);
        })
        .catch(error => {
          console.error('Error verifying login:', error);
          setUserAndAuthError(
            null,
            'Error verifying login. You have been logged out.',
          );
        });
    } else {
      setUserAndAuthError(null, 'Error signing in with Google');
    }
  } catch (error) {
    console.error(error);
    setUserAndAuthError(null, 'Error signing in. You have been logged out.');
  }
}

export async function logout() {
  try {
    await signOut(auth);
    // Clear the token cookie
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure';
    setUserAndAuthError(null, null);
  } catch (error) {
    console.error('Error signing out:', error);
    setUserAndAuthError(null, 'Error signing out. Please refresh the page.');
  }
}
