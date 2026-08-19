import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return result.user;
    } catch (error: any) {
        // Si el usuario no existe y es el admin solicitado, lo creamos y "hasheamos" la contraseña mediante Firebase Auth
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            if (email.toLowerCase() === 'aramayodanielagimena32@gmail.com') {
                 try {
                     const result = await createUserWithEmailAndPassword(auth, email, pass);
                     await setDoc(doc(db, 'admins', result.user.uid), {}, { merge: true }).catch(console.error);
                     return result.user;
                 } catch (createError) {
                     console.error("Error creating user:", createError);
                     throw createError;
                 }
            }
        }
        console.error("Email login failed:", error);
        throw error;
    }
}

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user.email === 'chisipufli.chisito@gmail.com' || result.user.email?.toLowerCase() === 'aramayodanielagimena32@gmail.com') {
            await setDoc(doc(db, 'admins', result.user.uid), {}, { merge: true }).catch(console.error);
        }
        return result.user;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

export const logout = () => signOut(auth);
