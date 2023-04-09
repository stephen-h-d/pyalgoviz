import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import auth from './auth';
import { setUser } from './authSignal';
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(_event: MouseEvent) {
  signInWithPopup(auth, googleProvider)
    .then(result => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential === null) {
        console.error('credential was null');
        setUser(null);
        return;
      }
      // The signed-in user info.
      const user = result.user;
      if (user) {
        setUser({
          firebase_user_id: user.uid,
          // TODO decide if I really need email or username or whatever
          email: user.email || '',
          // Add any other properties you need
        });
      }
    })
    .catch(error => {
      // Handle Errors here.
      // const errorCode = error.code;
      // const errorMessage = error.message;
      // The email of the user's account used.
      // const email = error.customData.email;
      // The AuthCredential type that was used.
      // const credential = GoogleAuthProvider.credentialFromError(error);
      console.error(error);
      setUser(null);
    });
}

export async function logout() {
    // set the user to null no matter what.  (I think that's the best approach anyway.)
    // TODO review this
    setUser(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
