import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  flattenTokens,
  mergeDocuments,
  resolveDocument,
} from '../dist/src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

async function loadFoundation() {
  const profile = await readJson('config/pfx-foundations.v0.1.json');
  const paths = Object.values(profile.families).flatMap((family) => [family.primitive, family.semantic]);
  const documents = await Promise.all(paths.map(readJson));
  return mergeDocuments(...documents);
}

function tokenValue(document, name) {
  const token = resolveDocument(document).tokens.find((item) => item.name === name);
  assert.ok(token, `Missing token: ${name}`);
  return token.resolvedValue;
}

test('accessibility policy targets WCAG 2.2 AA without claiming token-only conformance', async () => {
  const policy = await readJson('config/pfx-accessibility.v0.1.json');
  assert.equal(policy.standard.name, 'WCAG');
  assert.equal(policy.standard.version, '2.2');
  assert.equal(policy.standard.targetLevel, 'AA');
  assert.equal(policy.policies.targetSize.exceptionsMustBeEvaluated, true);
  assert.equal(policy.policies.focusVisible.enhancedGuidance.projectVerificationRequired, true);
  assert.equal(policy.policies.focusNotObscured.projectVerificationRequired, true);
});

test('accessibility target-size tokens resolve to 24px and 44px', async () => {
  const document = await loadFoundation();
  assert.deepEqual(tokenValue(document, 'size.target.minimum'), { value: 24, unit: 'px' });
  assert.deepEqual(tokenValue(document, 'size.target.enhanced'), { value: 44, unit: 'px' });
});

test('focus foundation resolves to a visible 2px baseline with offset', async () => {
  const document = await loadFoundation();
  assert.deepEqual(tokenValue(document, 'border.width.focus'), { value: 2, unit: 'px' });
  assert.deepEqual(tokenValue(document, 'border.focus.offset'), { value: 2, unit: 'px' });
  assert.ok(tokenValue(document, 'color.focus.ring'));
});

test('accessibility policy references real foundation tokens', async () => {
  const [policy, document] = await Promise.all([
    readJson('config/pfx-accessibility.v0.1.json'),
    loadFoundation(),
  ]);
  const names = new Set(flattenTokens(document).map((token) => token.name));
  for (const name of [
    policy.policies.focusVisible.colorToken,
    policy.policies.focusVisible.thicknessToken,
    policy.policies.focusVisible.offsetToken,
    policy.policies.targetSize.minimumToken,
    policy.policies.targetSize.enhanced.token,
  ]) {
    assert.equal(names.has(name), true, `Accessibility policy references missing token: ${name}`);
  }
});

test('reduced-motion accessibility mapping is valid in the mode profile', async () => {
  const [policy, modes] = await Promise.all([
    readJson('config/pfx-accessibility.v0.1.json'),
    readJson('config/pfx-modes.v0.1.json'),
  ]);
  const axis = modes.axes[policy.policies.motionPreference.modeAxis];
  assert.ok(axis);
  assert.ok(axis.options[policy.policies.motionPreference.modeOption]);
  assert.equal(policy.policies.motionPreference.mediaQuery, '(prefers-reduced-motion: reduce)');
});

test('layout accessibility policy keeps responsive conditions out of runtime tokens', async () => {
  const policy = await readJson('config/pfx-accessibility.v0.1.json');
  assert.equal(policy.policies.logicalProperties.required, true);
  assert.equal(policy.policies.responsive.breakpointsAreBuildRules, true);
  assert.equal(policy.policies.responsive.componentContextPrefersContainerQueries, true);
  assert.equal(policy.policies.responsive.viewportContextUsesMediaQueries, true);
});
