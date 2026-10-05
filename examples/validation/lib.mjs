import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyTokenOverrides,
  compileCssWithStyleDictionary,
  flattenTokens,
  mergeDocuments,
  resolveModePlan,
  validateDocument,
} from '../../dist/src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = resolve(here, '../..');

export async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(repositoryRoot, relativePath), 'utf8'));
}

export async function loadFoundation() {
  const foundationProfile = await readJson('config/pfx-foundations.v0.1.json');
  const paths = Object.values(foundationProfile.families)
    .flatMap((family) => [family.primitive, family.semantic]);
  const documents = await Promise.all(paths.map(readJson));
  return mergeDocuments(...documents);
}

function assertValid(document, label) {
  const result = validateDocument(document);
  if (result.valid) return;
  const details = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
  throw new Error(`${label} is invalid:\n${details}`);
}

export function cssVariableDefinitions(css) {
  return new Set([...css.matchAll(/(--pfx-[a-z0-9-]+)\s*:/g)].map((match) => match[1]));
}

export function cssVariableReferences(css) {
  return new Set([...css.matchAll(/var\((--pfx-[a-z0-9-]+)/g)].map((match) => match[1]));
}

export async function buildConsumer(profilePath) {
  const profile = await readJson(profilePath);
  const [foundation, modeProfile, primitives, overrides] = await Promise.all([
    loadFoundation(),
    readJson('config/pfx-modes.v0.1.json'),
    readJson(profile.primitives),
    readJson(profile.overrides),
  ]);

  assertValid(primitives, `${profile.id} project primitives`);
  assertValid(overrides, `${profile.id} project overrides`);

  const withProjectPrimitives = mergeDocuments(foundation, primitives);
  const plan = resolveModePlan(modeProfile, profile.modeSelection);
  const modeDocuments = await Promise.all(plan.files.map(readJson));
  const withModes = applyTokenOverrides(withProjectPrimitives, ...modeDocuments);
  const finalDocument = applyTokenOverrides(withModes, overrides);

  assertValid(finalDocument, `${profile.id} composed document`);

  const css = await compileCssWithStyleDictionary(finalDocument);
  const projectCss = await readFile(resolve(repositoryRoot, profile.stylesheet), 'utf8');
  const definitions = cssVariableDefinitions(css);
  const references = cssVariableReferences(projectCss);
  const missingReferences = [...references].filter((name) => !definitions.has(name)).sort();

  const outputDirectory = resolve(repositoryRoot, dirname(profilePath), 'generated');
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(resolve(outputDirectory, 'tokens.css'), css, 'utf8');

  const report = {
    id: profile.id,
    name: profile.name,
    modeSelection: plan.selection,
    tokenCount: flattenTokens(finalDocument).length,
    cssVariableCount: definitions.size,
    projectVariableReferenceCount: references.size,
    missingReferences,
  };
  await writeFile(resolve(outputDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');

  return {
    profile,
    plan,
    document: finalDocument,
    css,
    projectCss,
    report,
  };
}
