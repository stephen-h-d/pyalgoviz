import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import auth from './auth';
const googleProvider = new GoogleAuthProvider();

const button: HTMLElement | null = document.getElementById("google_signin");

async function signInWithGoogle(event: MouseEvent) {
    signInWithPopup(auth, googleProvider)
    .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential === null) {
            console.error("credential was null");
            return;
        }
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log(user);
    }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        console.error(error);
    });
}

if (button !== null) {
    button.addEventListener("click", signInWithGoogle);
}
