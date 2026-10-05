import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyTokenOverrides,
  mergeDocuments,
  resolveDocument,
  resolveModePlan,
  validateDocument,
} from '../dist/src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

async function loadBaseFoundation() {
  const profile = await readJson('config/pfx-foundations.v0.1.json');
  const paths = Object.values(profile.families).flatMap((family) => [family.primitive, family.semantic]);
  const documents = await Promise.all(paths.map(readJson));
  return mergeDocuments(...documents);
}

async function compose(selection) {
  const [base, profile] = await Promise.all([
    loadBaseFoundation(),
    readJson('config/pfx-modes.v0.1.json'),
  ]);
  const plan = resolveModePlan(profile, selection);
  const overrides = await Promise.all(plan.files.map(readJson));
  return {
    plan,
    document: applyTokenOverrides(base, ...overrides),
  };
}

function resolvedValue(document, name) {
  const token = resolveDocument(document).tokens.find((item) => item.name === name);
  assert.ok(token, `Missing resolved token: ${name}`);
  return token.resolvedValue;
}

test('default mode selection requires no override files', async () => {
  const profile = await readJson('config/pfx-modes.v0.1.json');
  const plan = resolveModePlan(profile);
  assert.deepEqual(plan.selection, {
    colorScheme: 'light',
    contrast: 'normal',
    density: 'default',
    motion: 'full',
  });
  assert.deepEqual(plan.files, []);
});

test('dark color scheme remaps semantic colors without changing primitives', async () => {
  const { document } = await compose({ colorScheme: 'dark' });
  assert.equal(validateDocument(document).valid, true);
  assert.deepEqual(
    resolvedValue(document, 'color.surface.canvas'),
    resolvedValue(document, 'color.palette.neutral.950'),
  );
  assert.deepEqual(
    resolvedValue(document, 'color.text.primary'),
    resolvedValue(document, 'color.palette.neutral.0'),
  );
});

test('high contrast composes over dark without a dark-high-contrast theme file', async () => {
  const { plan, document } = await compose({ colorScheme: 'dark', contrast: 'high' });
  assert.deepEqual(plan.files, [
    'tokens/modes/color-scheme/dark.json',
    'tokens/modes/contrast/high.json',
  ]);
  assert.deepEqual(
    resolvedValue(document, 'color.border.default'),
    resolvedValue(document, 'color.text.primary'),
  );
  assert.deepEqual(
    resolvedValue(document, 'color.text.secondary'),
    resolvedValue(document, 'color.text.primary'),
  );
});

test('compact density reduces control spacing and common layout gaps', async () => {
  const { document } = await compose({ density: 'compact' });
  assert.deepEqual(resolvedValue(document, 'space.control.inline-md'), { value: 12, unit: 'px' });
  assert.deepEqual(resolvedValue(document, 'space.control.block-md'), { value: 8, unit: 'px' });
  assert.deepEqual(resolvedValue(document, 'space.layout.gap-md'), { value: 16, unit: 'px' });
  assert.deepEqual(resolvedValue(document, 'space.layout.section-md'), { value: 48, unit: 'px' });
});

test('comfortable density increases control spacing without changing section spacing', async () => {
  const { document } = await compose({ density: 'comfortable' });
  assert.deepEqual(resolvedValue(document, 'space.control.inline-md'), { value: 20, unit: 'px' });
  assert.deepEqual(resolvedValue(document, 'space.control.block-md'), { value: 16, unit: 'px' });
  assert.deepEqual(resolvedValue(document, 'space.layout.gap-md'), { value: 32, unit: 'px' });
  assert.deepEqual(resolvedValue(document, 'space.layout.section-md'), { value: 48, unit: 'px' });
});

test('reduced motion shortens semantic durations while preserving easing', async () => {
  const { document } = await compose({ motion: 'reduced' });
  assert.deepEqual(resolvedValue(document, 'motion.duration.fast'), { value: 0, unit: 'ms' });
  assert.deepEqual(resolvedValue(document, 'motion.duration.default'), { value: 120, unit: 'ms' });
  assert.deepEqual(resolvedValue(document, 'motion.duration.slow'), { value: 120, unit: 'ms' });
  assert.deepEqual(
    resolvedValue(document, 'motion.easing.standard'),
    resolvedValue(document, 'motion.easing-curve.standard'),
  );
});

test('none motion maps all semantic durations to zero', async () => {
  const { document } = await compose({ motion: 'none' });
  for (const name of ['motion.duration.fast', 'motion.duration.default', 'motion.duration.slow']) {
    assert.deepEqual(resolvedValue(document, name), { value: 0, unit: 'ms' });
  }
});

test('all four axes compose deterministically in one selection', async () => {
  const { plan, document } = await compose({
    colorScheme: 'dark',
    contrast: 'high',
    density: 'compact',
    motion: 'reduced',
  });
  assert.equal(plan.files.length, 4);
  assert.deepEqual(resolvedValue(document, 'color.border.default'), resolvedValue(document, 'color.text.primary'));
  assert.deepEqual(resolvedValue(document, 'space.control.inline-md'), { value: 12, unit: 'px' });
  assert.deepEqual(resolvedValue(document, 'motion.duration.default'), { value: 120, unit: 'ms' });
});

test('mode plan rejects unknown axes and options', async () => {
  const profile = await readJson('config/pfx-modes.v0.1.json');
  assert.throws(() => resolveModePlan(profile, { unknown: 'x' }), /Unknown mode axis/);
  assert.throws(() => resolveModePlan(profile, { density: 'tiny' }), /Unknown mode option/);
});

test('mode overrides cannot create new semantic tokens', async () => {
  const base = await loadBaseFoundation();
  const override = {
    color: {
      invented: {
        $type: 'color',
        $value: '{color.palette.neutral.0}',
      },
    },
  };
  assert.throws(() => applyTokenOverrides(base, override), /cannot add unknown token/);
});

test('mode overrides cannot change an existing token type', async () => {
  const base = await loadBaseFoundation();
  const override = {
    space: {
      control: {
        'inline-md': {
          $type: 'color',
          $value: '{color.palette.neutral.0}',
        },
      },
    },
  };
  assert.throws(() => applyTokenOverrides(base, override), /type mismatch/);
});
