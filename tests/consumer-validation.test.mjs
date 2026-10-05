import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveDocument,
} from '../dist/src/index.js';
import {
  buildConsumer,
  cssVariableReferences,
  readJson,
} from '../examples/validation/lib.mjs';

const marketingProfile = 'examples/validation/marketing/profile.json';
const dashboardProfile = 'examples/validation/dashboard/profile.json';

function resolvedValue(document, name) {
  const token = resolveDocument(document).tokens.find((item) => item.name === name);
  assert.ok(token, `Missing resolved token: ${name}`);
  return token.resolvedValue;
}

function customPropertyForToken(name) {
  return `--pfx-${name.replaceAll('.', '-')}`;
}

test('marketing consumer compiles without missing PFx variables', async () => {
  const result = await buildConsumer(marketingProfile);
  assert.deepEqual(result.report.missingReferences, []);
  assert.deepEqual(result.plan.selection, {
    colorScheme: 'light',
    contrast: 'normal',
    density: 'comfortable',
    motion: 'full',
  });
  assert.ok(result.report.cssVariableCount >= 100);
  assert.ok(result.report.projectVariableReferenceCount >= 30);
});

test('dashboard consumer compiles without missing PFx variables', async () => {
  const result = await buildConsumer(dashboardProfile);
  assert.deepEqual(result.report.missingReferences, []);
  assert.deepEqual(result.plan.selection, {
    colorScheme: 'dark',
    contrast: 'normal',
    density: 'compact',
    motion: 'reduced',
  });
  assert.ok(result.report.cssVariableCount >= 100);
  assert.ok(result.report.projectVariableReferenceCount >= 30);
});

test('materially different consumers resolve different density and motion values', async () => {
  const [marketing, dashboard] = await Promise.all([
    buildConsumer(marketingProfile),
    buildConsumer(dashboardProfile),
  ]);

  assert.deepEqual(
    resolvedValue(marketing.document, 'space.control.inline-md'),
    { value: 20, unit: 'px' },
  );
  assert.deepEqual(
    resolvedValue(dashboard.document, 'space.control.inline-md'),
    { value: 12, unit: 'px' },
  );
  assert.deepEqual(
    resolvedValue(marketing.document, 'motion.duration.default'),
    { value: 200, unit: 'ms' },
  );
  assert.deepEqual(
    resolvedValue(dashboard.document, 'motion.duration.default'),
    { value: 120, unit: 'ms' },
  );
});

test('project identity stays outside the core and resolves through semantic overrides', async () => {
  const [marketing, dashboard] = await Promise.all([
    buildConsumer(marketingProfile),
    buildConsumer(dashboardProfile),
  ]);

  assert.deepEqual(
    resolvedValue(marketing.document, 'color.action.primary'),
    resolvedValue(marketing.document, 'color.palette.brand.500'),
  );
  assert.deepEqual(
    resolvedValue(dashboard.document, 'color.action.primary'),
    resolvedValue(dashboard.document, 'color.palette.brand.400'),
  );
  assert.notDeepEqual(
    resolvedValue(marketing.document, 'color.action.primary'),
    resolvedValue(dashboard.document, 'color.action.primary'),
  );
});

test('consumer validation evidence is backed by actual shared token usage', async () => {
  const [marketing, dashboard, observations] = await Promise.all([
    buildConsumer(marketingProfile),
    buildConsumer(dashboardProfile),
    readJson('examples/validation/observations.json'),
  ]);
  const marketingRefs = cssVariableReferences(marketing.projectCss);
  const dashboardRefs = cssVariableReferences(dashboard.projectCss);

  for (const candidate of observations.contractCandidates) {
    for (const token of candidate.evidence) {
      const variable = customPropertyForToken(token);
      assert.equal(marketingRefs.has(variable), true, `${candidate.id}: marketing does not use ${token}`);
      assert.equal(dashboardRefs.has(variable), true, `${candidate.id}: dashboard does not use ${token}`);
    }
  }
});

test('validation records candidates without prematurely creating Design Contracts', async () => {
  const observations = await readJson('examples/validation/observations.json');
  assert.equal(observations.result, 'core-consumed-without-fork');
  assert.equal(
    observations.contractCandidates.filter((candidate) => candidate.status === 'candidate').length,
    2,
  );
  assert.ok(
    observations.contractCandidates.some(
      (candidate) => candidate.id === 'elevated-surface' && candidate.status === 'needs-more-evidence',
    ),
  );
});
