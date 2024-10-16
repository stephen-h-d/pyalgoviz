import firebaseConfig from "./firebaseConfig";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

auth.onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in
    // TODO update the login state indicators
    console.log(`Signed in as ${user.displayName} (${user.email})`);
    user.getIdToken().then(function (token) {
      // Add the token to the browser's cookies. The server will then be
      // able to verify the token against the API.
      // SECURITY NOTE: As cookies can easily be modified, only put the
      // token (which is verified server-side) in a cookie; do not add other
      // user information.
      document.cookie = "token=" + token + "; SameSite=None ; Secure";
    });
  } else {
    // User is signed out.
    // TODO Update the login state indicators.
    // Clear the token cookie.
    document.cookie = "token=" + "; SameSite=None ; Secure";
  }
}, function (error) {
  console.log(error);
  alert('Unable to log in: ' + error)
});


export default auth;
