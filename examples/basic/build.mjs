import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyTokenOverrides,
  compileCss,
  mergeDocuments,
  resolveModePlan,
  validateDocument,
} from '../../dist/src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

const foundationProfile = await readJson('config/pfx-foundations.v0.1.json');
const foundationPaths = Object.values(foundationProfile.families)
  .flatMap((family) => [family.primitive, family.semantic]);
const documents = await Promise.all(foundationPaths.map(readJson));

const merged = mergeDocuments(...documents);
const validation = validateDocument(merged);

if (!validation.valid) {
  const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
  throw new Error(`Token validation failed:\n${details}`);
}

const outputDirectory = resolve(root, 'examples/basic/generated');
await mkdir(outputDirectory, { recursive: true });

await writeFile(resolve(outputDirectory, 'tokens.css'), compileCss(merged), 'utf8');

const modeProfile = await readJson('config/pfx-modes.v0.1.json');
const plan = resolveModePlan(modeProfile, {
  colorScheme: 'dark',
  contrast: 'high',
  density: 'compact',
  motion: 'reduced',
});
const modeDocuments = await Promise.all(plan.files.map(readJson));
const composed = applyTokenOverrides(merged, ...modeDocuments);

await writeFile(
  resolve(outputDirectory, 'tokens.dark-high-compact-reduced.css'),
  compileCss(composed),
  'utf8',
);

console.log(`Generated ${outputDirectory}`);
