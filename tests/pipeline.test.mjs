import test from 'node:test';
import assert from 'node:assert/strict';
import { compileCss, mergeDocuments, resolveDocument, validateDocument } from '../dist/src/index.js';
import { circularFixture, missingReferenceFixture } from './fixtures.mjs';

const primitive = {
  color: { palette: { accent: { 600: { $type: 'color', $value: { colorSpace: 'oklch', components: [0.58, 0.22, 262], alpha: 1 } } } } },
  space: { 4: { $type: 'dimension', $value: { value: 16, unit: 'px' } } },
};
const semantic = {
  color: { text: { accent: { $type: 'color', $value: '{color.palette.accent.600}' } } },
  space: { control: { inline: { $type: 'dimension', $value: '{space.4}' } } },
};

test('validates, resolves and compiles the bootstrap token pipeline', () => {
  const document = mergeDocuments(primitive, semantic);
  const validation = validateDocument(document);
  assert.equal(validation.valid, true);
  const resolved = resolveDocument(document);
  const accent = resolved.tokens.find((token) => token.name === 'color.text.accent');
  assert.ok(accent);
  assert.equal(accent.referencedToken, 'color.palette.accent.600');
  const css = compileCss(document);
  assert.match(css, /--pfx-color-text-accent: oklch\(58% 0\.22 262\);/);
  assert.match(css, /--pfx-space-control-inline: 16px;/);
});

test('rejects a missing token type', () => {
  const result = validateDocument({ color: { broken: { $value: '#fff' } } });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'type.missing'));
});

test('detects missing references', () => {
  assert.throws(() => resolveDocument(missingReferenceFixture), /Missing token reference/);
});

test('detects circular references', () => {
  assert.throws(() => resolveDocument(circularFixture), /Circular token reference/);
});

test('detects incompatible alias types', () => {
  const document = { space: { x: { $type: 'dimension', $value: { value: 4, unit: 'px' } } }, color: { broken: { $type: 'color', $value: '{space.x}' } } };
  assert.throws(() => resolveDocument(document), /Token type mismatch/);
});

test('generated CSS custom properties follow the PFx shared-token naming grammar', () => {
  const document = mergeDocuments(primitive, semantic);
  const css = compileCss(document);
  const names = [...css.matchAll(/(--[a-z0-9-]+):/g)].map((match) => match[1]);
  const pattern = /^--pfx-(?:color|space|size|radius|font|shadow|motion|z|layout|component)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
  assert.ok(names.length > 0);
  for (const name of names) assert.match(name, pattern);
});
