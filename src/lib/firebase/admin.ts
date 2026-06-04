// Firebase Admin SDK — SERVER ONLY. Holds privileged credentials.
// Never import this from a Client Component.
import "server-only";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  applicationDefault,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

function buildCredential() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Env stores the key with literal "\n"; normalize to real newlines.
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS / ADC when available.
  return applicationDefault();
}

/** True when explicit service-account env vars are present. */
export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

let cached: App | undefined;

export function getAdminApp(): App {
  if (cached) return cached;
  cached = getApps().length
    ? getApp()
    : initializeApp({
        credential: buildCredential(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
  return cached;
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function adminStorage(): Storage {
  return getStorage(getAdminApp());
}
