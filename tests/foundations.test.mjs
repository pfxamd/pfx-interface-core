import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compileCss,
  flattenTokens,
  mergeDocuments,
  resolveDocument,
  validateDocument,
} from '../dist/src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

async function loadProfile() {
  return readJson('config/pfx-foundations.v0.1.json');
}

async function loadFoundationDocuments() {
  const profile = await loadProfile();
  const paths = Object.values(profile.families).flatMap((family) => [family.primitive, family.semantic]);
  return Promise.all(paths.map(readJson));
}

test('foundation profile points to valid token documents', async () => {
  const profile = await loadProfile();
  for (const family of Object.values(profile.families)) {
    const primitive = await readJson(family.primitive);
    const semantic = await readJson(family.semantic);
    assert.equal(validateDocument(primitive).valid, true, family.primitive);
    assert.equal(validateDocument(semantic).valid, true, family.semantic);
  }
});

test('all required semantic foundation roles exist', async () => {
  const profile = await loadProfile();
  const documents = await loadFoundationDocuments();
  const merged = mergeDocuments(...documents);
  const names = new Set(flattenTokens(merged).map((token) => token.name));

  for (const family of Object.values(profile.families)) {
    for (const name of family.requiredSemantic) {
      assert.equal(names.has(name), true, `Missing required foundation token: ${name}`);
    }
  }
});

test('semantic foundation tokens are aliases rather than duplicated literal values', async () => {
  const profile = await loadProfile();
  for (const family of Object.values(profile.families)) {
    const document = await readJson(family.semantic);
    for (const token of flattenTokens(document)) {
      assert.equal(typeof token.value, 'string', `${token.name} should alias a primitive token`);
      assert.match(token.value, /^\{[^{}]+\}$/);
    }
  }
});

test('the complete foundation graph resolves without missing references or cycles', async () => {
  const documents = await loadFoundationDocuments();
  const merged = mergeDocuments(...documents);
  assert.equal(validateDocument(merged).valid, true);
  const resolved = resolveDocument(merged);
  assert.ok(resolved.tokens.length >= 100);
});

test('foundation CSS exposes every active foundation family', async () => {
  const documents = await loadFoundationDocuments();
  const css = compileCss(mergeDocuments(...documents));
  for (const variable of [
    '--pfx-color-text-primary:',
    '--pfx-space-layout-gap-md:',
    '--pfx-font-body-family:',
    '--pfx-motion-duration-default:',
    '--pfx-radius-control-md:',
    '--pfx-border-width-default:',
    '--pfx-shadow-surface-raised:',
    '--pfx-size-control-md:',
    '--pfx-z-layer-modal:',
    '--pfx-layout-container-content:',
  ]) {
    assert.match(css, new RegExp(variable));
  }
  assert.match(css, /--pfx-shadow-overlay-default: .*?, .*?;/);
});

test('foundation profile keeps contracts deferred', async () => {
  const profile = await loadProfile();
  assert.equal(profile.policy.contracts, 'deferred-until-repeated-project-evidence');
});
