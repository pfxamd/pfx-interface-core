import {
  flattenTokens,
  isRecord,
  isTokenDefinition,
  tokenCategories,
  tokenTypes,
  type ColorValue,
  type DimensionValue,
  type TokenDocument,
  type TokenType,
  type ValidationIssue,
  type ValidationResult,
} from '../core/index.js';

const topLevelCategories = new Set<string>(tokenCategories);

function isAlias(value: unknown): value is string {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value);
}

function validateColor(value: unknown): boolean {
  if (isAlias(value)) return true;
  if (!isRecord(value)) return false;
  const candidate = value as unknown as ColorValue;
  return typeof candidate.colorSpace === 'string'
    && Array.isArray(candidate.components)
    && candidate.components.length >= 3
    && candidate.components.every((item) => typeof item === 'number' || item === 'none')
    && (candidate.alpha === undefined || (typeof candidate.alpha === 'number' && candidate.alpha >= 0 && candidate.alpha <= 1));
}

function validateDimension(value: unknown): boolean {
  if (isAlias(value)) return true;
  if (!isRecord(value)) return false;
  const candidate = value as unknown as DimensionValue;
  return typeof candidate.value === 'number' && typeof candidate.unit === 'string' && candidate.unit.length > 0;
}

function validateTypedValue(type: TokenType | undefined, value: unknown): boolean {
  if (!type) return false;
  if (isAlias(value)) return true;

  switch (type) {
    case 'color':
      return validateColor(value);
    case 'dimension':
      return validateDimension(value);
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'string':
    case 'fontFamily':
    case 'fontWeight':
    case 'duration':
      return typeof value === 'string' || typeof value === 'number' || isRecord(value);
    default:
      return value !== undefined;
  }
}

export function validateDocument(document: TokenDocument): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isRecord(document) || Object.keys(document).length === 0) {
    return {
      valid: false,
      issues: [{ code: 'document.empty', path: '$', message: 'Token document must be a non-empty object.' }],
    };
  }

  for (const key of Object.keys(document)) {
    if (key.startsWith('$')) continue;
    if (!topLevelCategories.has(key)) {
      issues.push({
        code: 'category.unknown',
        path: key,
        message: `Unknown top-level token category: ${key}`,
      });
    }
  }

  function walk(node: Record<string, unknown>, path: string[], inheritedType?: TokenType): void {
    let localType = inheritedType;
    if ('$type' in node) {
      if (typeof node.$type !== 'string' || !tokenTypes.includes(node.$type as TokenType)) {
        issues.push({
          code: 'type.unknown',
          path: path.join('.') || '$',
          message: `Unsupported token type: ${String(node.$type)}`,
        });
      } else {
        localType = node.$type as TokenType;
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      const nextPath = [...path, key];
      if (!isRecord(value)) {
        issues.push({
          code: 'node.invalid',
          path: nextPath.join('.'),
          message: 'Token/group nodes must be objects.',
        });
        continue;
      }

      if (isTokenDefinition(value)) {
        const explicitType = typeof value.$type === 'string' && tokenTypes.includes(value.$type as TokenType)
          ? (value.$type as TokenType)
          : undefined;
        const tokenType = explicitType ?? localType;

        if (!tokenType) {
          issues.push({
            code: 'type.missing',
            path: nextPath.join('.'),
            message: 'Token type must be explicit or inherited from a group.',
          });
          continue;
        }

        if (!validateTypedValue(tokenType, value.$value)) {
          issues.push({
            code: 'value.invalid',
            path: nextPath.join('.'),
            message: `Value does not match token type ${tokenType}.`,
          });
        }
      } else {
        walk(value, nextPath, localType);
      }
    }
  }

  walk(document, []);

  const flattened = flattenTokens(document);
  if (flattened.length === 0) {
    issues.push({ code: 'token.none', path: '$', message: 'Document contains no tokens.' });
  }

  return { valid: issues.length === 0, issues };
}
