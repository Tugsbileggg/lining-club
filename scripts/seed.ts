/**
 * Seed Firestore with the Lining Club catalog + default settings.
 *
 *   npm run seed
 *
 * Requires admin credentials in .env.local (FIREBASE_PROJECT_ID,
 * FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). This script is self-contained
 * (it does NOT import the Next "server-only" admin module).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { seedProducts, seedCollections } from "../src/data/seed";

const here = dirname(fileURLToPath(import.meta.url));

// Minimal .env.local loader (no extra dependency).
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
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function main() {
  loadEnv();
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.error(
      "Missing Firebase admin credentials. Fill FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local.",
    );
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
  const db = getFirestore();

  return (async () => {
    let batch = db.batch();
    let ops = 0;
    const flush = async () => {
      if (ops) await batch.commit();
      batch = db.batch();
      ops = 0;
    };

    for (const c of seedCollections) {
      batch.set(db.collection("collections").doc(c.id), c);
      if (++ops >= 400) await flush();
    }
    for (const p of seedProducts) {
      batch.set(db.collection("products").doc(p.id), p);
      if (++ops >= 400) await flush();
    }

    batch.set(db.collection("settings").doc("store"), {
      shippingText:
        "Улаанбаатар хотод 1-2 хоногт хүргэнэ. Орон нутагт унаанд тавьж илгээнэ.",
      returnsText: "24 цагийн дотор солих боломжтой.",
      contact: { phone: "+976 8007 7460", address: "Улаанбаатар, Монгол" },
      banners: [],
    });
    ops++;
    await flush();

    console.log(
      `Seeded ${seedCollections.length} collections, ${seedProducts.length} products, settings.`,
    );
  })();
}

main();
