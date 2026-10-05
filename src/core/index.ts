export const tokenCategories = [
  'color',
  'space',
  'size',
  'radius',
  'border',
  'font',
  'shadow',
  'motion',
  'z',
  'layout',
  'component',
] as const;

export type TokenCategory = (typeof tokenCategories)[number];

export const tokenTypes = [
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'number',
  'strokeStyle',
  'border',
  'transition',
  'shadow',
  'gradient',
  'typography',
] as const;

export type TokenType = (typeof tokenTypes)[number];

export interface ReferenceValue {
  $ref: string;
}

export interface ColorValue {
  colorSpace: string;
  components: Array<number | 'none' | ReferenceValue>;
  alpha?: number | ReferenceValue;
  hex?: string;
}

export interface DimensionValue {
  value: number | ReferenceValue;
  unit: 'px' | 'rem' | ReferenceValue;
}

export interface DurationValue {
  value: number | ReferenceValue;
  unit: 'ms' | 's' | ReferenceValue;
}

export type TokenValue = unknown;

export interface TokenDefinition {
  $type?: TokenType;
  $value?: TokenValue;
  $ref?: string;
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: Record<string, unknown>;
}

export interface TokenGroup {
  $type?: TokenType;
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: Record<string, unknown>;
  $extends?: string;
  $root?: TokenDefinition;
  [key: string]: unknown;
}

export type TokenDocument = Record<string, unknown>;

export interface FlatToken {
  path: string[];
  name: string;
  type?: TokenType;
  explicitType?: TokenType;
  inheritedType?: TokenType;
  value?: TokenValue;
  reference?: string;
  source: TokenDefinition;
}

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isReferenceValue(value: unknown): value is ReferenceValue {
  return isRecord(value)
    && Object.keys(value).length === 1
    && typeof value.$ref === 'string';
}

export function isTokenDefinition(value: unknown): value is TokenDefinition {
  if (!isRecord(value)) return false;
  if (Object.prototype.hasOwnProperty.call(value, '$value')) return true;

  if (typeof value.$ref === 'string' && !Object.prototype.hasOwnProperty.call(value, '$extends')) {
    const childKeys = Object.keys(value).filter((key) => !key.startsWith('$'));
    return childKeys.length === 0;
  }

  return false;
}

export function pathToName(path: readonly string[]): string {
  return path.join('.');
}

export function flattenTokens(document: TokenDocument): FlatToken[] {
  const output: FlatToken[] = [];

  function addToken(value: TokenDefinition, path: string[], inheritedType?: TokenType): void {
    const explicitType = typeof value.$type === 'string' && tokenTypes.includes(value.$type as TokenType)
      ? (value.$type as TokenType)
      : undefined;
    const type = explicitType ?? inheritedType;

    output.push({
      path,
      name: pathToName(path),
      ...(type ? { type } : {}),
      ...(explicitType ? { explicitType } : {}),
      ...(inheritedType ? { inheritedType } : {}),
      ...(Object.prototype.hasOwnProperty.call(value, '$value') ? { value: value.$value } : {}),
      ...(typeof value.$ref === 'string' ? { reference: value.$ref } : {}),
      source: value,
    });
  }

  function walk(node: Record<string, unknown>, path: string[], inheritedType?: TokenType): void {
    const localType = typeof node.$type === 'string' && tokenTypes.includes(node.$type as TokenType)
      ? (node.$type as TokenType)
      : inheritedType;

    for (const [key, value] of Object.entries(node)) {
      if (key === '$root') {
        if (isTokenDefinition(value)) addToken(value, [...path, '$root'], localType);
        continue;
      }
      if (key.startsWith('$')) continue;
      if (!isRecord(value)) continue;

      const nextPath = [...path, key];
      if (isTokenDefinition(value)) addToken(value, nextPath, localType);
      else walk(value, nextPath, localType);
    }
  }

  walk(document, []);
  return output;
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function mergeDocuments(...documents: TokenDocument[]): TokenDocument {
  const merge = (
    left: Record<string, unknown>,
    right: Record<string, unknown>,
    path: string[],
  ): Record<string, unknown> => {
    const output: Record<string, unknown> = { ...left };

    for (const [key, value] of Object.entries(right)) {
      const current = output[key];
      if (current === undefined) {
        output[key] = value;
        continue;
      }

      const nextPath = [...path, key];
      const location = pathToName(nextPath) || '$';

      if (key === '$schema' && path.length === 0) {
        // $schema identifies an individual source file. The composed in-memory
        // document keeps the first schema hint even when source files reference
        // that schema through different relative paths.
        continue;
      }

      if (key.startsWith('$')) {
        if (!sameValue(current, value)) {
          throw new Error(`Conflicting metadata while merging token documents at ${location}`);
        }
        continue;
      }

      if (!isRecord(current) || !isRecord(value)) {
        throw new Error(`Conflicting token document nodes at ${location}`);
      }

      if (isTokenDefinition(current) || isTokenDefinition(value)) {
        throw new Error(`Duplicate or incompatible token definition at ${location}`);
      }

      output[key] = merge(current, value, nextPath);
    }

    return output;
  };

  return documents.reduce<TokenDocument>((acc, document) => merge(acc, document, []), {});
}
