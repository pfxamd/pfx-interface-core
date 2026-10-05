import {
  flattenTokens,
  isRecord,
  isReferenceValue,
  isTokenDefinition,
  pathToName,
  type FlatToken,
  type TokenDocument,
  type TokenGroup,
  type TokenType,
  type TokenValue,
} from '../core/index.js';
import { validateTokenValue } from '../validator/index.js';

const aliasPattern = /^\{([^{}]+)\}$/;

export interface ResolvedToken extends Omit<FlatToken, 'type'> {
  type: TokenType;
  resolvedValue: TokenValue;
  referencedToken?: string;
}

export interface ResolveResult {
  document: TokenDocument;
  tokens: ResolvedToken[];
}

function typeCompatible(source: TokenType | undefined, target: TokenType | undefined): boolean {
  return source === undefined || target === undefined || source === target;
}

function decodePointerSegment(segment: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    throw new Error(`Invalid JSON Pointer escape sequence: ${segment}`);
  }

  if (/~(?:[^01]|$)/.test(decoded)) {
    throw new Error(`Invalid JSON Pointer escape sequence: ${segment}`);
  }

  return decoded.replace(/~1/g, '/').replace(/~0/g, '~');
}

function pointerSegments(reference: string): string[] {
  if (reference === '#' || reference === '#/') return [];
  if (!reference.startsWith('#/')) {
    throw new Error(`Invalid JSON Pointer reference: ${reference}`);
  }
  return reference.slice(2).split('/').map(decodePointerSegment);
}

function readPath(root: unknown, segments: readonly string[], label: string): unknown {
  let current: unknown = root;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      if (!/^(0|[1-9]\d*)$/.test(segment)) {
        throw new Error(`Invalid array index in ${label}: ${segment}`);
      }
      const index = Number(segment);
      if (index >= current.length) throw new Error(`Unresolvable reference: ${label}`);
      current = current[index];
      continue;
    }

    if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
      throw new Error(`Unresolvable reference: ${label}`);
    }
    current = current[segment];
  }

  return current;
}

function parseCurlyPath(reference: string, label: string): string[] {
  const match = aliasPattern.exec(reference);
  if (!match?.[1]) throw new Error(`Invalid ${label} reference: ${reference}`);
  const segments = match[1].split('.');
  if (segments.some((segment) => segment.length === 0)) {
    throw new Error(`Invalid ${label} reference: ${reference}`);
  }
  return segments;
}

function parseGroupReference(reference: string): string[] {
  if (aliasPattern.test(reference)) return parseCurlyPath(reference, 'group');
  return pointerSegments(reference);
}

function isGroup(value: unknown): value is TokenGroup {
  return isRecord(value) && !isTokenDefinition(value);
}

function mergeExtendedGroup(base: Record<string, unknown>, local: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(local)) {
    if (key === '$extends') continue;
    const inherited = output[key];

    if (
      inherited !== undefined
      && isRecord(inherited)
      && isRecord(value)
      && isGroup(inherited)
      && isGroup(value)
      && key !== '$root'
    ) {
      output[key] = mergeExtendedGroup(inherited, value);
    } else {
      output[key] = value;
    }
  }

  return output;
}

export function resolveGroupExtensions(document: TokenDocument): TokenDocument {
  function resolveGroup(group: Record<string, unknown>, path: string[], activeGroups: string[]): Record<string, unknown> {
    const currentName = pathToName(path) || '$';
    let combined: Record<string, unknown> = { ...group };

    if (Object.prototype.hasOwnProperty.call(group, '$extends')) {
      if (typeof group.$extends !== 'string') {
        throw new Error(`Invalid group extension at ${currentName}`);
      }

      const targetPath = parseGroupReference(group.$extends);
      const targetName = pathToName(targetPath) || '$';
      if (activeGroups.includes(targetName)) {
        throw new Error(`Circular group extension: ${[...activeGroups, targetName].join(' -> ')}`);
      }

      const target = readPath(document, targetPath, group.$extends);
      if (!isGroup(target)) {
        throw new Error(`Group extension must reference a group: ${group.$extends}`);
      }

      const resolvedTarget = resolveGroup(target, targetPath, [...activeGroups, targetName]);
      combined = mergeExtendedGroup(resolvedTarget, group);
    }

    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(combined)) {
      if (key === '$extends') continue;
      if (key.startsWith('$')) {
        output[key] = value;
        continue;
      }
      output[key] = isGroup(value)
        ? resolveGroup(value, [...path, key], [...activeGroups, currentName])
        : value;
    }

    return output;
  }

  const output: TokenDocument = {};
  for (const [key, value] of Object.entries(document)) {
    if (key.startsWith('$')) {
      output[key] = value;
      continue;
    }
    output[key] = isGroup(value) ? resolveGroup(value, [key], [key]) : value;
  }
  return output;
}

export function resolveDocument(document: TokenDocument): ResolveResult {
  const expandedDocument = resolveGroupExtensions(document);
  const flat = flattenTokens(expandedDocument);
  const byName = new Map(flat.map((token) => [token.name, token]));
  const cache = new Map<string, ResolvedToken>();

  function resolvePointer(reference: string, tokenStack: string[], pointerStack: string[]): {
    value: unknown;
    type?: TokenType;
    referencedToken?: string;
  } {
    if (pointerStack.includes(reference)) {
      throw new Error(`Circular JSON Pointer reference: ${[...pointerStack, reference].join(' -> ')}`);
    }

    const segments = pointerSegments(reference);
    if (segments.at(-1) === '$value') {
      const tokenName = pathToName(segments.slice(0, -1));
      const token = byName.get(tokenName);
      if (token) {
        const resolved = resolveToken(tokenName, tokenStack, [...pointerStack, reference]);
        return { value: resolved.resolvedValue, type: resolved.type, referencedToken: tokenName };
      }
    }

    const raw = readPath(expandedDocument, segments, reference);
    return {
      value: resolveEmbedded(raw, tokenStack, [...pointerStack, reference]),
    };
  }

  function resolveEmbedded(value: unknown, tokenStack: string[], pointerStack: string[]): unknown {
    if (typeof value === 'string') {
      const match = aliasPattern.exec(value);
      if (match?.[1]) return resolveToken(match[1], tokenStack, pointerStack).resolvedValue;
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => resolveEmbedded(item, tokenStack, pointerStack));
    }

    if (isReferenceValue(value)) {
      return resolvePointer(value.$ref, tokenStack, pointerStack).value;
    }

    if (isRecord(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, resolveEmbedded(item, tokenStack, pointerStack)]),
      );
    }

    return value;
  }

  function resolveToken(name: string, stack: string[], pointerStack: string[]): ResolvedToken {
    const cached = cache.get(name);
    if (cached) return cached;

    const token = byName.get(name);
    if (!token) throw new Error(`Missing token reference: ${name}`);
    if (stack.includes(name)) {
      throw new Error(`Circular token reference: ${[...stack, name].join(' -> ')}`);
    }

    const nextStack = [...stack, name];
    let resolvedValue: unknown;
    let resolvedType = token.type;
    let referencedToken: string | undefined;

    if (token.reference) {
      const pointer = resolvePointer(token.reference, nextStack, pointerStack);
      resolvedValue = pointer.value;
      referencedToken = pointer.referencedToken;
      if (!typeCompatible(token.explicitType, pointer.type)) {
        throw new Error(`Token type mismatch: ${name} (${token.explicitType}) -> ${pointer.referencedToken ?? token.reference} (${pointer.type})`);
      }
      resolvedType = token.explicitType ?? pointer.type ?? token.inheritedType;
    } else if (typeof token.value === 'string') {
      const match = aliasPattern.exec(token.value);
      if (match?.[1]) {
        const target = resolveToken(match[1], nextStack, pointerStack);
        if (!typeCompatible(token.explicitType, target.type)) {
          throw new Error(`Token type mismatch: ${name} (${token.explicitType}) -> ${target.name} (${target.type})`);
        }
        resolvedType = token.explicitType ?? target.type;
        resolvedValue = target.resolvedValue;
        referencedToken = target.name;
      } else {
        resolvedType = token.explicitType ?? token.inheritedType;
        resolvedValue = token.value;
      }
    } else {
      resolvedType = token.explicitType ?? token.inheritedType;
      resolvedValue = resolveEmbedded(token.value, nextStack, pointerStack);
    }

    if (!resolvedType) {
      throw new Error(`Token type cannot be determined: ${name}`);
    }
    if (!validateTokenValue(resolvedType, resolvedValue)) {
      throw new Error(`Resolved value does not match token type ${resolvedType}: ${name}`);
    }

    const resolved: ResolvedToken = {
      ...token,
      type: resolvedType,
      resolvedValue,
      ...(referencedToken ? { referencedToken } : {}),
    };
    cache.set(name, resolved);
    return resolved;
  }

  return {
    document: expandedDocument,
    tokens: flat.map((token) => resolveToken(token.name, [], [])),
  };
}
