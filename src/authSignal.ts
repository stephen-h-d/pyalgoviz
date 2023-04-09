import { onAuthStateChanged } from 'firebase/auth';
import { createSignal } from 'solid-js';
import auth from './auth';

export interface User {
  readonly firebase_user_id: string;
  readonly email: string;
}

const [user, setUser] = createSignal<User | null>(null);

export { user, setUser };

onAuthStateChanged(auth, (firebaseUser) => {
    console.log("firebaseuser",firebaseUser);
    if (firebaseUser) {
      const { uid, email } = firebaseUser;
      // TODO decide if I really need email or username or whatever
      setUser({ firebase_user_id:uid, email:email||'' });
    } else {
      setUser(null);
    }
  });
