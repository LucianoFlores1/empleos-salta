import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Indica si Firebase está realmente configurado (hay .env con la API key).
 * Si es false, la app corre en "modo dev": no se conecta a Firebase y usa
 * datos de ejemplo (ver src/api.ts) para poder ver el diseño localmente.
 */
export const isFirebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

// Valores dummy cuando no hay configuración: evitan que getAuth/getFirestore
// lancen "auth/invalid-api-key" y rompan toda la app con pantalla en blanco.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:demo',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
}

export const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
};

export const logout = () => signOut(auth);

export const checkIsAdmin = async (uid: string) => {
    try {
        const snap = await getDoc(doc(db, 'admins', uid));
        return snap.exists();
    } catch (e) {
        return false;
    }
};
