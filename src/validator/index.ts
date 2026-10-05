import {
  flattenTokens,
  isRecord,
  isReferenceValue,
  isTokenDefinition,
  tokenCategories,
  tokenTypes,
  type ColorValue,
  type DimensionValue,
  type DurationValue,
  type TokenDocument,
  type TokenType,
  type ValidationIssue,
  type ValidationResult,
} from '../core/index.js';

const topLevelCategories = new Set<string>(tokenCategories);
const sourceNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const aliasPattern = /^\{[^{}.]+(?:\.[^{}.]+)*\}$/;
const pointerPattern = /^#(?:\/.*)?$/;
const tokenProperties = new Set(['$type', '$value', '$ref', '$description', '$deprecated', '$extensions']);
const groupProperties = new Set(['$type', '$description', '$deprecated', '$extensions', '$extends', '$root']);

const fontWeightNames = new Set([
  'thin', 'hairline', 'extra-light', 'ultra-light', 'light', 'normal', 'regular', 'book',
  'medium', 'semi-bold', 'demi-bold', 'bold', 'extra-bold', 'ultra-bold', 'black', 'heavy',
  'extra-black', 'ultra-black',
]);
const strokeStyleNames = new Set(['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'outset', 'inset']);
const lineCapNames = new Set(['round', 'butt', 'square']);

const colorSpaces: Record<string, readonly [(value: number) => boolean, (value: number) => boolean, (value: number) => boolean]> = {
  srgb: [unitInterval, unitInterval, unitInterval],
  'srgb-linear': [unitInterval, unitInterval, unitInterval],
  hsl: [hueRange, percentageRange, percentageRange],
  hwb: [hueRange, percentageRange, percentageRange],
  lab: [percentageRange, finiteNumber, finiteNumber],
  lch: [percentageRange, nonNegative, hueRange],
  oklab: [unitInterval, finiteNumber, finiteNumber],
  oklch: [unitInterval, nonNegative, hueRange],
  'display-p3': [unitInterval, unitInterval, unitInterval],
  'a98-rgb': [unitInterval, unitInterval, unitInterval],
  'prophoto-rgb': [unitInterval, unitInterval, unitInterval],
  rec2020: [unitInterval, unitInterval, unitInterval],
  'xyz-d65': [unitInterval, unitInterval, unitInterval],
  'xyz-d50': [unitInterval, unitInterval, unitInterval],
};

function finiteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function unitInterval(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function percentageRange(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function hueRange(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value < 360;
}

function nonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isAlias(value: unknown): value is string {
  return typeof value === 'string' && aliasPattern.test(value);
}

function isResolvableSubValue(value: unknown): boolean {
  return isAlias(value) || isReferenceValue(value);
}

function validateReferenceObject(value: unknown): boolean {
  return !isReferenceValue(value) || pointerPattern.test(value.$ref);
}

function validateColor(value: unknown): boolean {
  if (isResolvableSubValue(value)) return validateReferenceObject(value);
  if (!isRecord(value)) return false;
  const candidate = value as unknown as ColorValue;
  const rules = colorSpaces[candidate.colorSpace];
  if (!rules || !Array.isArray(candidate.components) || candidate.components.length !== 3) return false;

  for (let index = 0; index < 3; index += 1) {
    const component = candidate.components[index];
    if (component === 'none' || isResolvableSubValue(component)) {
      if (!validateReferenceObject(component)) return false;
      continue;
    }
    if (typeof component !== 'number' || !rules[index]?.(component)) return false;
  }

  if (candidate.alpha !== undefined) {
    if (isResolvableSubValue(candidate.alpha)) {
      if (!validateReferenceObject(candidate.alpha)) return false;
    } else if (typeof candidate.alpha !== 'number' || !unitInterval(candidate.alpha)) {
      return false;
    }
  }

  return candidate.hex === undefined || /^#[0-9a-fA-F]{6}$/.test(candidate.hex);
}

function validateDimension(value: unknown): boolean {
  if (isResolvableSubValue(value)) return validateReferenceObject(value);
  if (!isRecord(value)) return false;
  const candidate = value as unknown as DimensionValue;
  const numericValid = typeof candidate.value === 'number'
    ? Number.isFinite(candidate.value)
    : isResolvableSubValue(candidate.value) && validateReferenceObject(candidate.value);
  const unitValid = typeof candidate.unit === 'string'
    ? candidate.unit === 'px' || candidate.unit === 'rem'
    : isResolvableSubValue(candidate.unit) && validateReferenceObject(candidate.unit);
  return numericValid && unitValid;
}

function validateDuration(value: unknown): boolean {
  if (isResolvableSubValue(value)) return validateReferenceObject(value);
  if (!isRecord(value)) return false;
  const candidate = value as unknown as DurationValue;
  const numericValid = typeof candidate.value === 'number'
    ? Number.isFinite(candidate.value)
    : isResolvableSubValue(candidate.value) && validateReferenceObject(candidate.value);
  const unitValid = typeof candidate.unit === 'string'
    ? candidate.unit === 'ms' || candidate.unit === 's'
    : isResolvableSubValue(candidate.unit) && validateReferenceObject(candidate.unit);
  return numericValid && unitValid;
}

function validateFontFamily(value: unknown): boolean {
  if (isResolvableSubValue(value)) return validateReferenceObject(value);
  if (typeof value === 'string') return value.length > 0;
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.length > 0);
}

function validateFontWeight(value: unknown): boolean {
  if (isResolvableSubValue(value)) return validateReferenceObject(value);
  if (typeof value === 'number') return Number.isFinite(value) && value >= 1 && value <= 1000;
  return typeof value === 'string' && fontWeightNames.has(value);
}

function validateCubicBezier(value: unknown): boolean {
  if (isResolvableSubValue(value)) return validateReferenceObject(value);
  if (!Array.isArray(value) || value.length !== 4) return false;
  return value.every((item, index) => {
    if (isResolvableSubValue(item)) return validateReferenceObject(item);
    if (typeof item !== 'number' || !Number.isFinite(item)) return false;
    return index === 0 || index === 2 ? item >= 0 && item <= 1 : true;
  });
}

function validateStrokeStyle(value: unknown): boolean {
  if (isResolvableSubValue(value)) return validateReferenceObject(value);
  if (typeof value === 'string') return strokeStyleNames.has(value);
  if (!isRecord(value) || !Array.isArray(value.dashArray) || !lineCapNames.has(String(value.lineCap))) return false;
  return value.dashArray.length > 0 && value.dashArray.every(validateDimension);
}

function validateComposite(value: unknown, type: TokenType): boolean {
  if (isResolvableSubValue(value)) return validateReferenceObject(value);

  switch (type) {
    case 'strokeStyle':
      return validateStrokeStyle(value);
    case 'shadow':
    case 'gradient':
      return Array.isArray(value) || isRecord(value);
    case 'border':
    case 'transition':
    case 'typography':
      return isRecord(value);
    default:
      return false;
  }
}

export function validateTokenValue(type: TokenType | undefined, value: unknown): boolean {
  if (!type) return false;
  if (isAlias(value)) return true;

  switch (type) {
    case 'color':
      return validateColor(value);
    case 'dimension':
      return validateDimension(value);
    case 'fontFamily':
      return validateFontFamily(value);
    case 'fontWeight':
      return validateFontWeight(value);
    case 'duration':
      return validateDuration(value);
    case 'cubicBezier':
      return validateCubicBezier(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'strokeStyle':
    case 'border':
    case 'transition':
    case 'shadow':
    case 'gradient':
    case 'typography':
      return validateComposite(value, type);
  }
}

function validateMetadata(
  node: Record<string, unknown>,
  path: string,
  allowed: ReadonlySet<string>,
  issues: ValidationIssue[],
): void {
  for (const key of Object.keys(node)) {
    if (key.startsWith('$') && !allowed.has(key)) {
      issues.push({ code: 'property.unknown', path: `${path}.${key}`, message: `Unknown reserved property: ${key}` });
    }
  }

  if ('$description' in node && typeof node.$description !== 'string') {
    issues.push({ code: 'description.invalid', path, message: '$description must be a string.' });
  }
  if ('$deprecated' in node && typeof node.$deprecated !== 'boolean' && typeof node.$deprecated !== 'string') {
    issues.push({ code: 'deprecated.invalid', path, message: '$deprecated must be a boolean or string.' });
  }
  if ('$extensions' in node && !isRecord(node.$extensions)) {
    issues.push({ code: 'extensions.invalid', path, message: '$extensions must be an object.' });
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

  if ('$schema' in document && typeof document.$schema !== 'string') {
    issues.push({ code: 'schema.invalid', path: '$.$schema', message: '$schema must be a string.' });
  }

  for (const key of Object.keys(document)) {
    if (key === '$schema') continue;
    if (key.startsWith('$')) {
      issues.push({ code: 'property.unknown', path: `$.${key}`, message: `Unknown top-level reserved property: ${key}` });
      continue;
    }
    if (!topLevelCategories.has(key)) {
      issues.push({ code: 'category.unknown', path: key, message: `Unknown top-level token category: ${key}` });
    }
  }

  function validateName(name: string, path: string): void {
    if (!sourceNamePattern.test(name)) {
      issues.push({
        code: 'name.invalid',
        path,
        message: 'PFx token and group names must use lowercase kebab-case or numeric segments.',
      });
    }
  }

  function walk(
    node: Record<string, unknown>,
    path: string[],
    inheritedType?: TokenType,
    inheritedTypeMayResolve = false,
  ): void {
    const pathLabel = path.join('.') || '$';
    validateMetadata(node, pathLabel, groupProperties, issues);

    let localType = inheritedType;
    if ('$type' in node) {
      if (typeof node.$type !== 'string' || !tokenTypes.includes(node.$type as TokenType)) {
        issues.push({ code: 'type.unknown', path: pathLabel, message: `Unsupported token type: ${String(node.$type)}` });
      } else {
        localType = node.$type as TokenType;
      }
    }

    const localTypeMayResolve = inheritedTypeMayResolve || typeof node.$extends === 'string';
    if ('$extends' in node) {
      if (typeof node.$extends !== 'string' || (!aliasPattern.test(node.$extends) && !pointerPattern.test(node.$extends))) {
        issues.push({ code: 'extends.invalid', path: pathLabel, message: '$extends must be a curly-brace group reference or JSON Pointer.' });
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$') && key !== '$root') continue;
      const nextPath = key === '$root' ? [...path, '$root'] : [...path, key];
      const nextLabel = nextPath.join('.');

      if (key !== '$root') validateName(key, nextLabel);
      if (!isRecord(value)) {
        issues.push({ code: 'node.invalid', path: nextLabel, message: 'Token/group nodes must be objects.' });
        continue;
      }

      if (key === '$root' && !isTokenDefinition(value)) {
        issues.push({ code: 'root.invalid', path: nextLabel, message: '$root must be a token definition.' });
        continue;
      }

      if (isTokenDefinition(value)) {
        validateMetadata(value, nextLabel, tokenProperties, issues);
        const childKeys = Object.keys(value).filter((property) => !property.startsWith('$'));
        if (childKeys.length > 0) {
          issues.push({ code: 'token.children', path: nextLabel, message: 'A token cannot also contain child tokens or groups.' });
        }

        const hasValue = Object.prototype.hasOwnProperty.call(value, '$value');
        const hasReference = Object.prototype.hasOwnProperty.call(value, '$ref');
        if (hasValue === hasReference) {
          issues.push({ code: 'token.source', path: nextLabel, message: 'A token must define exactly one of $value or $ref.' });
          continue;
        }
        if (hasReference && (typeof value.$ref !== 'string' || !pointerPattern.test(value.$ref))) {
          issues.push({ code: 'ref.invalid', path: nextLabel, message: '$ref must be a valid local JSON Pointer.' });
        }

        const explicitType = typeof value.$type === 'string' && tokenTypes.includes(value.$type as TokenType)
          ? (value.$type as TokenType)
          : undefined;
        const tokenType = explicitType ?? localType;
        const valueIsAlias = hasValue && isAlias(value.$value);
        const typeMayResolveFromReference = valueIsAlias || hasReference;

        if (!tokenType && !typeMayResolveFromReference && !localTypeMayResolve) {
          issues.push({ code: 'type.missing', path: nextLabel, message: 'Token type must be explicit or inherited from a group.' });
          continue;
        }

        if (hasValue && tokenType && !validateTokenValue(tokenType, value.$value)) {
          issues.push({ code: 'value.invalid', path: nextLabel, message: `Value does not match token type ${tokenType}.` });
        }
      } else {
        walk(value, nextPath, localType, localTypeMayResolve);
      }
    }
  }

  for (const [key, value] of Object.entries(document)) {
    if (key.startsWith('$')) continue;
    if (!isRecord(value)) continue;
    validateName(key, key);
    if (isTokenDefinition(value)) {
      issues.push({
        code: 'category.token',
        path: key,
        message: 'Top-level PFx token categories must be groups, not tokens.',
      });
    } else {
      walk(value, [key]);
    }
  }

  const flattened = flattenTokens(document);
  if (flattened.length === 0) {
    issues.push({ code: 'token.none', path: '$', message: 'Document contains no tokens.' });
  }

  return { valid: issues.length === 0, issues };
}
