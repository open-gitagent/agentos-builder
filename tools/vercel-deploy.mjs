#!/usr/bin/env node
/**
 * vercel-deploy — publish a prebuilt static UI directory to Vercel via the REST API.
 * No Vercel CLI required. Node 18+ (uses global fetch + crypto).
 *
 * Usage:
 *   VERCEL_TOKEN=xxx node tools/vercel-deploy.mjs \
 *     --dir artifacts/dashboard/dist/public \
 *     --name acme-agenticos \
 *     [--prod] [--team <teamId>]
 *
 * Flow (per Vercel docs):
 *   1) For each file: sha1 + size; upload bytes to POST /v2/files (deduped by digest).
 *   2) POST /v13/deployments with the file manifest + SPA fallback routing.
 * Prints a JSON result with the live url. Exits non-zero on failure.
 */
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";

const API = "https://api.vercel.com";

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    o[key] = next && !next.startsWith("--") ? (i++, next) : true;
  }
  return o;
}

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.VERCEL_TOKEN;
  const team = args.team || process.env.VERCEL_TEAM_ID || "";
  const dir = args.dir || args.build_dir || "artifacts/dashboard/dist/public";
  const name = args.name || args.project_name || "agenticos-dashboard";
  const prod = Boolean(args.prod);
  const q = team ? `?teamId=${encodeURIComponent(team)}` : "";

  if (!token) {
    console.error("error: VERCEL_TOKEN environment variable is required");
    process.exit(1);
  }

  const paths = await walk(dir);
  if (paths.length === 0) {
    console.error(`error: no files found in "${dir}". Build the dashboard first ` +
      `(pnpm --filter @workspace/dashboard build).`);
    process.exit(1);
  }

  // 1) Upload files (dedup by sha1).
  const manifest = [];
  const uploaded = new Set();
  for (const abs of paths) {
    const data = await readFile(abs);
    const sha = createHash("sha1").update(data).digest("hex");
    const file = relative(dir, abs).split(sep).join("/");
    manifest.push({ file, sha, size: data.length });
    if (uploaded.has(sha)) continue;
    uploaded.add(sha);
    const res = await fetch(`${API}/v2/files${q}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "x-vercel-digest": sha,
      },
      body: data,
    });
    if (!res.ok && res.status !== 409) {
      console.error(`error: upload failed for ${file}: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
  }

  // 2) Create the deployment with SPA filesystem-then-index fallback.
  const body = {
    name,
    files: manifest,
    projectSettings: { framework: null },
    routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/index.html" }],
    ...(prod ? { target: "production" } : {}),
  };
  const res = await fetch(`${API}/v13/deployments${q}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = await res.json();
  if (!res.ok) {
    console.error(`error: deployment failed: ${res.status} ${JSON.stringify(out)}`);
    process.exit(1);
  }

  const result = {
    url: out.url ? `https://${out.url}` : null,
    inspectorUrl: out.inspectorUrl ?? null,
    id: out.id ?? null,
    readyState: out.readyState ?? out.status ?? null,
    target: prod ? "production" : "preview",
    files: manifest.length,
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(`error: ${err?.stack || err}`);
  process.exit(1);
});
