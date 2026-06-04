/**
 * Grant an existing Firebase Auth user an admin/staff role.
 *
 *   npm run set-admin -- you@example.com admin
 *   npm run set-admin -- staff@example.com staff
 *
 * Create the user first in Firebase Console → Authentication (Email/Password).
 * This sets the `role` custom claim AND writes admins/{uid}. The user must
 * sign out/in (or refresh their token) for the claim to take effect.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const here = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const path = resolve(here, "..", ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    if (!key) continue;
    let val = m[2] ?? "";
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    )
      val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function main() {
  loadEnv();
  const email = process.argv[2];
  const role = (process.argv[3] ?? "admin").toLowerCase();

  if (!email || (role !== "admin" && role !== "staff")) {
    console.error("Usage: npm run set-admin -- <email> <admin|staff>");
    process.exit(1);
  }
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.error("Missing Firebase admin credentials in .env.local.");
    process.exit(1);
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  const auth = getAuth();
  const db = getFirestore();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { role });
  await db.collection("admins").doc(user.uid).set({
    uid: user.uid,
    email: user.email ?? email,
    name: user.displayName ?? "",
    role,
    createdAt: Date.now(),
  });
  console.log(`✓ ${email} → role "${role}" (uid ${user.uid}). Ask them to re-login.`);
}

main();
