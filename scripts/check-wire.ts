/**
 * Probe a Wire API base URL and auth scheme.
 *
 *   npm run check-wire                      # uses WIRE_API_BASE_URL from .env.local
 *   npm run check-wire -- https://api.wire.mn
 *
 * Wire issues the API key on its own; the base URL and the auth header format
 * come from its docs. This script calls `GET /v1/operator_connections` with the
 * key presented four different ways and reports which combination answers 200 —
 * so a candidate URL can be confirmed without touching the app.
 *
 * The key is never printed, only a masked prefix.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Minimal .env.local loader (mirrors scripts/seed.ts — no extra dependency).
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

function mask(key: string): string {
  return key.length <= 8 ? "***" : `${key.slice(0, 4)}…${key.slice(-2)}`;
}

const SCHEMES: { label: string; headers: (key: string) => Record<string, string> }[] = [
  { label: "Authorization: Bearer <key>", headers: (k) => ({ Authorization: `Bearer ${k}` }) },
  { label: "Authorization: <key>", headers: (k) => ({ Authorization: k }) },
  { label: "X-API-Key: <key>", headers: (k) => ({ "X-API-Key": k }) },
  { label: "Authorization: Token <key>", headers: (k) => ({ Authorization: `Token ${k}` }) },
];

async function probe(base: string, key: string, scheme: (typeof SCHEMES)[number]) {
  const url = `${base}/v1/operator_connections`;
  try {
    const res = await fetch(url, {
      headers: { ...scheme.headers(key), Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.text()).slice(0, 300).replace(/\s+/g, " ");
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  loadEnv();

  const raw = (process.argv[2] ?? process.env.WIRE_API_BASE_URL ?? "").trim();
  const key = (process.env.WIRE_API_KEY ?? "").trim();

  if (!key) {
    console.error("WIRE_API_KEY алга. .env.local дээр нэмнэ үү.");
    process.exit(1);
  }
  if (!raw) {
    console.error(
      "Base URL алга. Аргумент болгож дамжуулна уу:\n" +
        "  npm run check-wire -- https://api.example.mn",
    );
    process.exit(1);
  }

  // Same normalization the app applies, so what passes here passes there.
  const base = raw.replace(/\/+$/, "").replace(/\/v1$/i, "");
  console.log(`Base URL : ${base}${base === raw ? "" : `  (оруулсан: ${raw})`}`);
  console.log(`API key  : ${mask(key)}`);
  console.log(`Endpoint : ${base}/v1/operator_connections\n`);

  let matched = false;
  for (const scheme of SCHEMES) {
    const r = await probe(base, key, scheme);
    const mark = r.ok ? "OK  " : "FAIL";
    console.log(`[${mark}] ${scheme.label}\n        ${r.status || "-"} ${r.body}\n`);
    if (r.ok) {
      matched = true;
      if (scheme.label.startsWith("Authorization: Bearer")) {
        console.log("→ Bearer ажиллаж байна — код яг үүнийг ашиглаж байгаа тул өөрчлөх юм алга.\n");
      } else {
        console.log(
          `→ Энэ схем ажиллалаа. src/lib/payments/wire.ts доторх wireFetch()-ийн\n` +
            `  Authorization толгойг "${scheme.label}" болгож солино уу.\n`,
        );
      }
      break;
    }
  }

  if (!matched) {
    console.log(
      "Аль нь ч ажиллаагүй. 401/403 бол key эсвэл схем буруу; 404 бол зам буруу;\n" +
        "ENOTFOUND/timeout бол base URL өөрөө буруу байна.",
    );
    process.exit(1);
  }
}

void main();
