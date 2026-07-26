import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// ⚠️ IMPORTANTE: Reemplaza estos valores con tu configuración de Firebase.
// Ve a: Consola Firebase → Configuración del proyecto → Tus apps → SDK setup
// Estas claves son PÚBLICAS (publishable) — es seguro tenerlas en el código.
//
// Puedes también definirlas como variables de entorno (VITE_FIREBASE_*)
// y se leerán automáticamente sin tocar este archivo.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "TU_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "TU_PROYECTO.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "TU_PROYECTO",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "TU_PROYECTO.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:abcdef",
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== "TU_API_KEY";

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

function ensureApp() {
  if (typeof window === "undefined") return null;
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

export function getDb(): Firestore | null {
  const a = ensureApp();
  if (!a) return null;
  if (!dbInstance) dbInstance = getFirestore(a);
  return dbInstance;
}

export function getFbAuth(): Auth | null {
  const a = ensureApp();
  if (!a) return null;
  if (!authInstance) authInstance = getAuth(a);
  return authInstance;
}
