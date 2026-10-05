import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCss, mergeDocuments, validateDocument } from '../../dist/src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

const documents = await Promise.all([
  readJson('tokens/primitive/color.json'),
  readJson('tokens/primitive/space.json'),
  readJson('tokens/semantic/color.json'),
  readJson('tokens/semantic/space.json'),
  readJson('tokens/primitive/typography.json'),
  readJson('tokens/semantic/typography.json'),
]);

const merged = mergeDocuments(...documents);
const validation = validateDocument(merged);

if (!validation.valid) {
  const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
  throw new Error(`Token validation failed:\n${details}`);
}

const css = compileCss(merged);
const outputPath = resolve(root, 'examples/basic/generated/tokens.css');

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, css, 'utf8');
console.log(`Generated ${outputPath}`);
