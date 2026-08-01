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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDco9b5XPNULAuNi-XWWnmxNhjF39e9euM",
  authDomain: "salon-946b4.firebaseapp.com",
  projectId: "salon-946b4",
  storageBucket: "salon-946b4.firebasestorage.app",
  messagingSenderId: "762130368161",
  appId: "1:762130368161:web:05488f368dbe6e1f9692e0",
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
