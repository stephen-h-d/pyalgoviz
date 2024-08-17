import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import auth from './auth';
import { setUserAndAuthError } from './authSignal';
const googleProvider = new GoogleAuthProvider();


export function signInWithGoogle(_event: MouseEvent) {
  signInWithPopup(auth, googleProvider)
    .then(result => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential === null) {
        console.error('credential was null');
        setUserAndAuthError(null, 'Error signing in with Google. No credential');
        return;
      }
      // The signed-in user info.
      const user = result.user;
      console.log("cookie",document.cookie);
      if (user) {
        // call verify_login to make sure the token is valid
        fetch('/api/verify_login', {})
        .then(response => {
          if (!response.ok) {
            // If the response status is not in the range 200-299
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json(); // Assuming the response is JSON, adjust as needed
        })
        .then(_data => {
          console.log('verified login');
          const newUser = {
            firebase_user_id: user.uid,
            email: user.email || '',
          };
          setUserAndAuthError(newUser, null);
        })
        .catch(error => {
          console.error('Error verifying login:', error);
          setUserAndAuthError(null, 'Error verifying login. You have been logged out.');
        });

      } else {
      setUserAndAuthError(null, 'Error signing in with Google');
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
      setUserAndAuthError(null, 'Error signing in. You have been logged out.')
    });
}

export async function logout() {
  try {
    await signOut(auth);
    setUserAndAuthError(null, null);
  } catch (error) {
    console.error('Error signing out:', error);
    setUserAndAuthError(null, 'Error signing out. Please refresh the page.');
  }
}
