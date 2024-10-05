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

// This handles the initial login state.
// When we verify login, we also set it there, because this code could run
// after the verify_login API call.
auth.onAuthStateChanged(
  function (user) {
    if (user) {
      // User is signed in
      user
        .getIdToken()
        .then(function (token) {
          // Add the token to the browser's cookies. The server will then be
          // able to verify the token against the API.
          // SECURITY NOTE: As cookies can easily be modified, only put the
          // token (which is verified server-side) in a cookie; do not add other
          // user information.
          document.cookie =
            'token=' + token + '; path=/; SameSite=None; Secure';
          console.log('Successfully got login token');
        })
        .catch(error => console.log('Error getting token:', error));
    } else {
      // User is signed out.
      // Clear the token cookie.
      document.cookie =
        'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure';
    }
  },
  function (error) {
    console.error('Unable to log in:', error);
  },
);

export default auth;
