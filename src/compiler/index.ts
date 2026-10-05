import type { ColorValue, DimensionValue, DurationValue, TokenDocument } from '../core/index.js';
import { isRecord } from '../core/index.js';
import { resolveDocument, type ResolvedToken } from '../resolver/index.js';
import { validateDocument } from '../validator/index.js';

export interface CssCompileOptions {
  selector?: string;
  header?: string;
}

export interface CompilerProvider {
  readonly name: string;
  compileCss(document: TokenDocument, options?: CssCompileOptions): string;
}

function customPropertyName(token: ResolvedToken): string {
  const path = token.path.filter((segment) => segment !== '$root');
  return `--pfx-${path.join('-')}`;
}

function trimNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function alphaSuffix(alpha: number | undefined): string {
  return alpha !== undefined && alpha < 1 ? ` / ${trimNumber(alpha)}` : '';
}

function component(value: number | 'none'): string {
  return value === 'none' ? 'none' : trimNumber(value);
}

function percentageComponent(value: number | 'none'): string {
  return value === 'none' ? 'none' : `${trimNumber(value)}%`;
}

function serializeColor(value: unknown): string {
  if (!isRecord(value)) throw new Error('Color token must resolve to a structured color value.');
  const candidate = value as unknown as ColorValue;
  if (!Array.isArray(candidate.components) || candidate.components.length !== 3 || typeof candidate.colorSpace !== 'string') {
    throw new Error('Invalid structured color value.');
  }
  if (candidate.components.some((item) => typeof item !== 'number' && item !== 'none')) {
    throw new Error('Color references must be resolved before CSS compilation.');
  }
  if (candidate.alpha !== undefined && typeof candidate.alpha !== 'number') {
    throw new Error('Color alpha references must be resolved before CSS compilation.');
  }

  const values = candidate.components as Array<number | 'none'>;
  const a = values[0]!;
  const b = values[1]!;
  const c = values[2]!;
  const suffix = alphaSuffix(candidate.alpha as number | undefined);

  switch (candidate.colorSpace) {
    case 'hsl':
      return `hsl(${component(a)} ${percentageComponent(b)} ${percentageComponent(c)}${suffix})`;
    case 'hwb':
      return `hwb(${component(a)} ${percentageComponent(b)} ${percentageComponent(c)}${suffix})`;
    case 'lab':
      return `lab(${percentageComponent(a)} ${component(b)} ${component(c)}${suffix})`;
    case 'lch':
      return `lch(${percentageComponent(a)} ${component(b)} ${component(c)}${suffix})`;
    case 'oklab': {
      const lightness = a === 'none' ? 'none' : `${trimNumber(a * 100)}%`;
      return `oklab(${lightness} ${component(b)} ${component(c)}${suffix})`;
    }
    case 'oklch': {
      const lightness = a === 'none' ? 'none' : `${trimNumber(a * 100)}%`;
      return `oklch(${lightness} ${component(b)} ${component(c)}${suffix})`;
    }
    case 'srgb':
    case 'srgb-linear':
    case 'display-p3':
    case 'a98-rgb':
    case 'prophoto-rgb':
    case 'rec2020':
    case 'xyz-d65':
    case 'xyz-d50':
      return `color(${candidate.colorSpace} ${component(a)} ${component(b)} ${component(c)}${suffix})`;
    default:
      throw new Error(`Unsupported color space for CSS output: ${candidate.colorSpace}`);
  }
}

function serializeDimension(value: unknown): string {
  if (!isRecord(value)) throw new Error('Dimension token must resolve to a structured dimension value.');
  const candidate = value as unknown as DimensionValue;
  if (typeof candidate.value !== 'number' || typeof candidate.unit !== 'string') {
    throw new Error('Dimension references must be resolved before CSS compilation.');
  }
  return `${trimNumber(candidate.value)}${candidate.unit}`;
}

function serializeDuration(value: unknown): string {
  if (!isRecord(value)) throw new Error('Duration token must resolve to a structured duration value.');
  const candidate = value as unknown as DurationValue;
  if (typeof candidate.value !== 'number' || typeof candidate.unit !== 'string') {
    throw new Error('Duration references must be resolved before CSS compilation.');
  }
  return `${trimNumber(candidate.value)}${candidate.unit}`;
}

function serializeFontFamily(value: unknown): string {
  const families = typeof value === 'string' ? [value] : value;
  if (!Array.isArray(families) || !families.every((item) => typeof item === 'string')) {
    throw new Error('Invalid fontFamily value.');
  }
  const genericFamilies = new Set([
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-serif',
    'ui-sans-serif',
    'ui-monospace',
    'ui-rounded',
    'math',
    'fangsong',
  ]);
  return families.map((family) => genericFamilies.has(family) ? family : JSON.stringify(family)).join(', ');
}

function serializeStrokeStyle(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Reference compiler currently supports named strokeStyle values only.');
  }
  return value;
}

function serializeShadowLayer(value: unknown): string {
  if (!isRecord(value)) throw new Error('Shadow layer must resolve to an object.');
  const required = ['offsetX', 'offsetY', 'blur', 'spread', 'color'] as const;
  for (const key of required) {
    if (!(key in value)) throw new Error(`Shadow layer is missing ${key}.`);
  }

  return [
    serializeDimension(value.offsetX),
    serializeDimension(value.offsetY),
    serializeDimension(value.blur),
    serializeDimension(value.spread),
    serializeColor(value.color),
  ].join(' ');
}

function serializeShadow(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) throw new Error('Shadow token must contain at least one layer.');
    return value.map(serializeShadowLayer).join(', ');
  }
  return serializeShadowLayer(value);
}

function serializeToken(token: ResolvedToken): string {
  switch (token.type) {
    case 'color':
      return serializeColor(token.resolvedValue);
    case 'dimension':
      return serializeDimension(token.resolvedValue);
    case 'duration':
      return serializeDuration(token.resolvedValue);
    case 'number':
      return String(token.resolvedValue);
    case 'fontWeight':
      return String(token.resolvedValue);
    case 'fontFamily':
      return serializeFontFamily(token.resolvedValue);
    case 'strokeStyle':
      return serializeStrokeStyle(token.resolvedValue);
    case 'shadow':
      return serializeShadow(token.resolvedValue);
    case 'cubicBezier': {
      if (!Array.isArray(token.resolvedValue) || token.resolvedValue.length !== 4 || token.resolvedValue.some((item) => typeof item !== 'number')) {
        throw new Error('Invalid resolved cubicBezier value.');
      }
      return `cubic-bezier(${token.resolvedValue.map((item) => trimNumber(item as number)).join(', ')})`;
    }
    default:
      throw new Error(`Reference compiler does not yet serialize token type: ${token.type}`);
  }
}

export const referenceCompiler: CompilerProvider = {
  name: 'pfx-reference',
  compileCss(document, options = {}) {
    const validation = validateDocument(document);
    if (!validation.valid) {
      const detail = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
      throw new Error(`Token validation failed:\n${detail}`);
    }

    const selector = options.selector ?? ':root';
    const header = options.header ?? '/* Generated by PFx Interface Core. Do not edit directly. */';
    const resolved = resolveDocument(document).tokens;
    const names = new Set<string>();
    const lines = resolved
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((token) => {
        const name = customPropertyName(token);
        if (names.has(name)) throw new Error(`CSS custom property collision: ${name}`);
        names.add(name);
        return `  ${name}: ${serializeToken(token)};`;
      });

    return `${header}\n${selector} {\n${lines.join('\n')}\n}\n`;
  },
};

export function compileCss(document: TokenDocument, options?: CssCompileOptions): string {
  return referenceCompiler.compileCss(document, options);
}
