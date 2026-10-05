import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

async function sourceFiles(moduleName) {
  const dir = resolve(root, 'src', moduleName);
  return (await readdir(dir))
    .filter((name) => name.endsWith('.ts'))
    .map((name) => resolve(dir, name));
}

async function assertNoImports(moduleName, forbiddenFragments) {
  for (const file of await sourceFiles(moduleName)) {
    const source = await readFile(file, 'utf8');
    for (const fragment of forbiddenFragments) {
      assert.equal(source.includes(fragment), false, `${moduleName} must not depend on ${fragment}`);
    }
  }
}

test('manifest source-of-truth paths exist', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'pfx-interface.manifest.json'), 'utf8'));
  for (const relativePath of Object.values(manifest.sourceOfTruth)) {
    await access(resolve(root, relativePath));
  }
  await access(resolve(root, manifest.publicBoundary));
});

test('core remains dependency-free from upper modules and vendor tooling', async () => {
  await assertNoImports('core', ['/validator/', '/modes/', '/resolver/', '/compiler/', 'style-dictionary']);
});

test('validator, modes and resolver preserve one-way dependency boundaries', async () => {
  await assertNoImports('validator', ['/modes/', '/resolver/', '/compiler/', 'style-dictionary']);
  await assertNoImports('modes', ['/resolver/', '/compiler/', 'style-dictionary']);
  await assertNoImports('resolver', ['/modes/', '/compiler/', 'style-dictionary']);
});

test('vendor tooling is isolated to compiler', async () => {
  for (const moduleName of ['core', 'validator', 'modes', 'resolver']) {
    await assertNoImports(moduleName, ['style-dictionary']);
  }
  const publicApi = await readFile(resolve(root, 'src/index.ts'), 'utf8');
  assert.equal(publicApi.includes('style-dictionary'), false);
});

test('bootstrap contains no speculative runtime foundation, contract, GUI, or workspace layer', async () => {
  for (const relativePath of ['src/foundations', 'src/contracts', 'apps', 'ui', 'packages']) {
    await assert.rejects(access(resolve(root, relativePath)), /ENOENT/);
  }
});

test('machine config and executable token categories stay synchronized', async () => {
  const config = JSON.parse(await readFile(resolve(root, 'config/pfx-interface.default.json'), 'utf8'));
  const built = await import('../dist/src/index.js');
  assert.deepEqual([...built.tokenCategories], config.tokens.allowedTopLevelCategories);
});

test('machine-readable conformance declaration matches the implemented bootstrap target', async () => {
  const config = JSON.parse(await readFile(resolve(root, 'config/pfx-interface.default.json'), 'utf8'));
  assert.equal(config.conformance.target, 'DTCG-2025.10');
  assert.equal(config.conformance.status, 'documented-subset');
  assert.equal(config.conformance.supported.rootTokens, true);
  assert.equal(config.conformance.supported.jsonPointerReferences, true);
  assert.equal(config.conformance.supported.groupExtends, true);
  assert.equal(config.conformance.supported.groupRefAlias, false);
});

test('all committed machine JSON files parse successfully', async () => {
  const files = [
    'config/pfx-interface.default.json',
    'config/pfx-foundations.v0.1.json',
    'config/pfx-accessibility.v0.1.json',
    'config/pfx-modes.v0.1.json',
    'pfx-interface.manifest.json',
    'schema/interface-config.schema.json',
    'schema/foundations.schema.json',
    'schema/accessibility.schema.json',
    'schema/modes.schema.json',
    'schema/interface-manifest.schema.json',
    'schema/token-file.schema.json',
    'tokens/primitive/color.json',
    'tokens/primitive/space.json',
    'tokens/primitive/typography.json',
    'tokens/primitive/motion.json',
    'tokens/primitive/radius.json',
    'tokens/primitive/border.json',
    'tokens/primitive/shadow.json',
    'tokens/primitive/size.json',
    'tokens/primitive/z.json',
    'tokens/primitive/layout.json',
    'tokens/semantic/color.json',
    'tokens/semantic/space.json',
    'tokens/semantic/typography.json',
    'tokens/semantic/motion.json',
    'tokens/semantic/radius.json',
    'tokens/semantic/border.json',
    'tokens/semantic/shadow.json',
    'tokens/semantic/size.json',
    'tokens/semantic/z.json',
    'tokens/semantic/layout.json',
    'tokens/modes/color-scheme/dark.json',
    'tokens/modes/contrast/high.json',
    'tokens/modes/density/compact.json',
    'tokens/modes/density/comfortable.json',
    'tokens/modes/motion/reduced.json',
    'tokens/modes/motion/none.json',
  ];
  for (const file of files) {
    const content = await readFile(resolve(root, file), 'utf8');
    assert.doesNotThrow(() => JSON.parse(content), file);
  }
});
