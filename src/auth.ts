import firebaseConfig from "./firebaseConfig";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export default auth;
