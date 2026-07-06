/**
 * Post-build check: program route chunks and _routes.json static excludes exist.
 * Run after `next-on-pages` (see package.json build:pages).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const OUTPUT_ROOT = path.resolve('.vercel/output/static');
const ROUTES_FILE = path.join(OUTPUT_ROOT, '_routes.json');
const CHUNK_DIRS = [
  path.join(OUTPUT_ROOT, '_next/static/chunks/app/[program]'),
  path.join(OUTPUT_ROOT, '_next/static/chunks/app/%5Bprogram%5D'),
];

function fail(message) {
  console.error(`verify-static-chunks: ${message}`);
  process.exit(1);
}

if (!existsSync(OUTPUT_ROOT)) {
  fail(`missing build output at ${OUTPUT_ROOT} — run pnpm run build:pages first`);
}

if (!existsSync(ROUTES_FILE)) {
  fail(`missing ${ROUTES_FILE}`);
}

let routes;
try {
  routes = JSON.parse(readFileSync(ROUTES_FILE, 'utf8'));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  fail(`invalid JSON in ${ROUTES_FILE}: ${message}`);
}

const excludes = Array.isArray(routes.exclude) ? routes.exclude : [];
if (!excludes.some((entry) => entry === '/_next/static/*' || entry === '/_next/static/**')) {
  fail(
    `_routes.json must exclude /_next/static/* (found: ${JSON.stringify(excludes)})`
  );
}

const programChunkDir = CHUNK_DIRS.find((dir) => existsSync(dir));
if (!programChunkDir) {
  fail(
    `missing program page chunk directory — expected one of:\n  ${CHUNK_DIRS.join('\n  ')}`
  );
}

const programPageChunks = readdirSync(programChunkDir).filter(
  (name) => name.startsWith('page-') && name.endsWith('.js')
);

if (programPageChunks.length === 0) {
  fail(`no page-*.js chunks in ${programChunkDir}`);
}

console.log(
  `verify-static-chunks: ok (${programPageChunks.length} program page chunk(s), _routes.json excludes static assets)`
);
