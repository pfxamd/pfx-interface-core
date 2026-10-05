import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compileCss,
  flattenTokens,
  mergeDocuments,
  resolveDocument,
  resolveGroupExtensions,
  tokenTypes,
  validateDocument,
} from '../dist/src/index.js';

const red = { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1, hex: '#ff0000' };
const blue = { colorSpace: 'srgb', components: [0, 0, 1], alpha: 1, hex: '#0000ff' };

test('supports DTCG $root tokens and emits a natural PFx custom property name', () => {
  const document = {
    color: {
      accent: {
        $type: 'color',
        $root: { $value: red },
        muted: { $value: { colorSpace: 'srgb', components: [0.5, 0, 0] } },
      },
    },
  };

  assert.equal(validateDocument(document).valid, true);
  assert.ok(flattenTokens(document).some((token) => token.name === 'color.accent.$root'));
  const css = compileCss(document);
  assert.match(css, /--pfx-color-accent: color\(srgb 1 0 0\);/);
  assert.match(css, /--pfx-color-accent-muted: color\(srgb 0\.5 0 0\);/);
});

test('infers alias type from the referenced token when $type is omitted', () => {
  const document = {
    color: {
      base: { $type: 'color', $value: blue },
      alias: { $value: '{color.base}' },
    },
  };

  assert.equal(validateDocument(document).valid, true);
  const alias = resolveDocument(document).tokens.find((token) => token.name === 'color.alias');
  assert.equal(alias?.type, 'color');
  assert.deepEqual(alias?.resolvedValue, blue);
});

test('supports token-level JSON Pointer references and infers their type', () => {
  const document = {
    color: {
      base: { $type: 'color', $value: red },
      alias: { $ref: '#/color/base/$value' },
    },
  };

  assert.equal(validateDocument(document).valid, true);
  const alias = resolveDocument(document).tokens.find((token) => token.name === 'color.alias');
  assert.equal(alias?.type, 'color');
  assert.deepEqual(alias?.resolvedValue, red);
});

test('resolves JSON Pointer property references inside structured values', () => {
  const document = {
    color: {
      base: { $type: 'color', $value: { colorSpace: 'srgb', components: [0.2, 0.4, 0.9] } },
      derived: {
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [
            { $ref: '#/color/base/$value/components/0' },
            { $ref: '#/color/base/$value/components/1' },
            0.7,
          ],
        },
      },
    },
  };

  assert.equal(validateDocument(document).valid, true);
  const derived = resolveDocument(document).tokens.find((token) => token.name === 'color.derived');
  assert.deepEqual(derived?.resolvedValue, { colorSpace: 'srgb', components: [0.2, 0.4, 0.7] });
});

test('resolves JSON Pointer array indexes', () => {
  const document = {
    color: {
      base: { $type: 'color', $value: { colorSpace: 'srgb', components: [0.1, 0.2, 0.3] } },
    },
    size: {
      sample: { $type: 'number', $ref: '#/color/base/$value/components/2' },
    },
  };

  const sample = resolveDocument(document).tokens.find((token) => token.name === 'size.sample');
  assert.equal(sample?.resolvedValue, 0.3);
});

test('supports $extends group inheritance with local token replacement', () => {
  const document = {
    layout: {
      base: {
        small: { $type: 'dimension', $value: { value: 8, unit: 'px' } },
        large: { $type: 'dimension', $value: { value: 24, unit: 'px' } },
      },
      compact: {
        $extends: '{layout.base}',
        large: { $type: 'dimension', $value: { value: 16, unit: 'px' } },
      },
    },
  };

  assert.equal(validateDocument(document).valid, true);
  const expanded = resolveGroupExtensions(document);
  assert.deepEqual(expanded.layout.compact.small.$value, { value: 8, unit: 'px' });
  assert.deepEqual(expanded.layout.compact.large.$value, { value: 16, unit: 'px' });
  const names = resolveDocument(document).tokens.map((token) => token.name);
  assert.ok(names.includes('layout.compact.small'));
  assert.ok(names.includes('layout.compact.large'));
});

test('detects circular group extensions', () => {
  const document = {
    layout: {
      a: { $extends: '{layout.b}', x: { $type: 'dimension', $value: { value: 1, unit: 'px' } } },
      b: { $extends: '{layout.a}', y: { $type: 'dimension', $value: { value: 2, unit: 'px' } } },
    },
  };
  assert.throws(() => resolveGroupExtensions(document), /Circular group extension/);
});

test('rejects DTCG-invalid dimension units', () => {
  const result = validateDocument({ space: { invalid: { $type: 'dimension', $value: { value: 10, unit: '%' } } } });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'value.invalid'));
});

test('rejects invalid color spaces and out-of-range color components', () => {
  const invalidSpace = validateDocument({ color: { bad: { $type: 'color', $value: { colorSpace: 'rgb-ish', components: [1, 0, 0] } } } });
  const invalidHue = validateDocument({ color: { bad: { $type: 'color', $value: { colorSpace: 'oklch', components: [0.5, 0.2, 360] } } } });
  assert.equal(invalidSpace.valid, false);
  assert.equal(invalidHue.valid, false);
});

test('enforces deterministic PFx source-token naming', () => {
  const result = validateDocument({ color: { 'Bad Name': { $type: 'color', $value: red } } });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'name.invalid'));
});

test('rejects tokens that also contain child nodes', () => {
  const document = {
    color: {
      broken: {
        $type: 'color',
        $value: red,
        child: { $type: 'color', $value: blue },
      },
    },
  };
  const result = validateDocument(document);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'token.children'));
});

test('mergeDocuments rejects duplicate token definitions instead of silently overwriting them', () => {
  const left = { color: { primary: { $type: 'color', $value: red } } };
  const right = { color: { primary: { $type: 'color', $value: blue } } };
  assert.throws(() => mergeDocuments(left, right), /Duplicate or incompatible token definition/);
});

test('reference compiler validates input before generating CSS', () => {
  const invalid = { space: { broken: { $type: 'dimension', $value: { value: 4, unit: 'em' } } } };
  assert.throws(() => compileCss(invalid), /Token validation failed/);
});

test('compiler serializes additional DTCG color spaces correctly', () => {
  const document = {
    color: {
      hsl: { $type: 'color', $value: { colorSpace: 'hsl', components: [120, 50, 25], alpha: 0.5 } },
      lab: { $type: 'color', $value: { colorSpace: 'lab', components: [60, 20, -10] } },
      p3: { $type: 'color', $value: { colorSpace: 'display-p3', components: [1, 0.2, 0.3] } },
    },
  };
  const css = compileCss(document);
  assert.match(css, /hsl\(120 50% 25% \/ 0\.5\)/);
  assert.match(css, /lab\(60% 20 -10\)/);
  assert.match(css, /color\(display-p3 1 0\.2 0\.3\)/);
});

test('only DTCG 2025.10 token types are exposed by the bootstrap core', () => {
  assert.equal(tokenTypes.includes('boolean'), false);
  assert.equal(tokenTypes.includes('string'), false);
  assert.ok(tokenTypes.includes('typography'));
});

test('a whole-token alias inherits the referenced token type before parent-group type', () => {
  const document = {
    color: {
      $type: 'color',
      visual: { $value: red },
      'spacing-alias': { $value: '{space.base}' },
    },
    space: {
      base: { $type: 'dimension', $value: { value: 12, unit: 'px' } },
    },
  };

  assert.equal(validateDocument(document).valid, true);
  const alias = resolveDocument(document).tokens.find((token) => token.name === 'color.spacing-alias');
  assert.equal(alias?.type, 'dimension');
  assert.deepEqual(alias?.resolvedValue, { value: 12, unit: 'px' });
});

test('group extensions can supply an inherited type to local override tokens', () => {
  const document = {
    layout: {
      base: {
        $type: 'dimension',
        gap: { $value: { value: 16, unit: 'px' } },
      },
      compact: {
        $extends: '{layout.base}',
        gap: { $value: { value: 8, unit: 'px' } },
      },
    },
  };

  assert.equal(validateDocument(document).valid, true);
  const gap = resolveDocument(document).tokens.find((token) => token.name === 'layout.compact.gap');
  assert.equal(gap?.type, 'dimension');
  assert.deepEqual(gap?.resolvedValue, { value: 8, unit: 'px' });
});

test('PFx categories cannot be used directly as tokens', () => {
  const result = validateDocument({ color: { $type: 'color', $value: red } });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'category.token'));
});

test('resolver rejects JSON Pointer property values that do not match the declared token type', () => {
  const document = {
    color: {
      base: { $type: 'color', $value: { colorSpace: 'srgb', components: [0.1, 0.2, 0.3] } },
    },
    size: {
      broken: { $type: 'dimension', $ref: '#/color/base/$value/components/0' },
    },
  };
  assert.throws(() => resolveDocument(document), /Resolved value does not match token type dimension/);
});

test('resolver rejects invalid values whose type arrives through group extension', () => {
  const document = {
    layout: {
      base: {
        $type: 'dimension',
        gap: { $value: { value: 16, unit: 'px' } },
      },
      broken: {
        $extends: '{layout.base}',
        gap: { $value: { value: 8, unit: 'em' } },
      },
    },
  };
  assert.equal(validateDocument(document).valid, true);
  assert.throws(() => resolveDocument(document), /Resolved value does not match token type dimension/);
});

test('compiler preserves DTCG none color components without invalid percentage suffixes', () => {
  const document = {
    color: {
      sample: { $type: 'color', $value: { colorSpace: 'hsl', components: ['none', 'none', 50] } },
    },
  };
  const css = compileCss(document);
  assert.match(css, /hsl\(none none 50%\)/);
  assert.equal(css.includes('none%'), false);
});
