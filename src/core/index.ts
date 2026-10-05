export const tokenCategories = [
  'color',
  'space',
  'size',
  'radius',
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
  'number',
  'duration',
  'cubicBezier',
  'fontFamily',
  'fontWeight',
  'strokeStyle',
  'border',
  'transition',
  'shadow',
  'gradient',
  'typography',
  'boolean',
  'string',
] as const;

export type TokenType = (typeof tokenTypes)[number];

export interface ColorValue {
  colorSpace: string;
  components: Array<number | 'none'>;
  alpha?: number;
}

export interface DimensionValue {
  value: number;
  unit: string;
}

export type TokenValue = unknown;

export interface TokenDefinition {
  $type?: TokenType;
  $value: TokenValue;
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: Record<string, unknown>;
}

export interface TokenGroup {
  $type?: TokenType;
  $description?: string;
  $extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

export type TokenDocument = Record<string, unknown>;

export interface FlatToken {
  path: string[];
  name: string;
  type?: TokenType;
  value: TokenValue;
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

export function isTokenDefinition(value: unknown): value is TokenDefinition {
  return isRecord(value) && Object.prototype.hasOwnProperty.call(value, '$value');
}

export function pathToName(path: readonly string[]): string {
  return path.join('.');
}

export function flattenTokens(document: TokenDocument): FlatToken[] {
  const output: FlatToken[] = [];

  function walk(node: Record<string, unknown>, path: string[], inheritedType?: TokenType): void {
    const localType = typeof node.$type === 'string' && tokenTypes.includes(node.$type as TokenType)
      ? (node.$type as TokenType)
      : inheritedType;

    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      if (!isRecord(value)) continue;

      const nextPath = [...path, key];
      if (isTokenDefinition(value)) {
        const tokenType = typeof value.$type === 'string' ? value.$type : localType;
        output.push({
          path: nextPath,
          name: pathToName(nextPath),
          ...(tokenType ? { type: tokenType as TokenType } : {}),
          value: value.$value,
          source: value,
        });
      } else {
        walk(value, nextPath, localType);
      }
    }
  }

  walk(document, []);
  return output;
}

export function mergeDocuments(...documents: TokenDocument[]): TokenDocument {
  const merge = (left: Record<string, unknown>, right: Record<string, unknown>): Record<string, unknown> => {
    const output: Record<string, unknown> = { ...left };
    for (const [key, value] of Object.entries(right)) {
      const current = output[key];
      if (isRecord(current) && isRecord(value) && !isTokenDefinition(current) && !isTokenDefinition(value)) {
        output[key] = merge(current, value);
      } else {
        output[key] = value;
      }
    }
    return output;
  };

  return documents.reduce<TokenDocument>((acc, document) => merge(acc, document), {});
}
