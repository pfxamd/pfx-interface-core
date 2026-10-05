import {
  flattenTokens,
  type FlatToken,
  type TokenDocument,
  type TokenType,
  type TokenValue,
} from '../core/index.js';

const aliasPattern = /^\{([^{}]+)\}$/;

export interface ResolvedToken extends FlatToken {
  resolvedValue: TokenValue;
  referencedToken?: string;
}

export interface ResolveResult {
  tokens: ResolvedToken[];
}

function typeCompatible(source: TokenType | undefined, target: TokenType | undefined): boolean {
  return source === undefined || target === undefined || source === target;
}

export function resolveDocument(document: TokenDocument): ResolveResult {
  const flat = flattenTokens(document);
  const byName = new Map(flat.map((token) => [token.name, token]));
  const cache = new Map<string, ResolvedToken>();

  function resolve(name: string, stack: string[]): ResolvedToken {
    const cached = cache.get(name);
    if (cached) return cached;

    const token = byName.get(name);
    if (!token) throw new Error(`Missing token reference: ${name}`);
    if (stack.includes(name)) {
      throw new Error(`Circular token reference: ${[...stack, name].join(' -> ')}`);
    }

    if (typeof token.value === 'string') {
      const match = aliasPattern.exec(token.value);
      if (match) {
        const referencedName = match[1];
        if (!referencedName) throw new Error(`Invalid token reference in ${name}`);
        const referenced = resolve(referencedName, [...stack, name]);
        if (!typeCompatible(token.type, referenced.type)) {
          throw new Error(`Token type mismatch: ${name} (${token.type}) -> ${referencedName} (${referenced.type})`);
        }
        const resolved: ResolvedToken = {
          ...token,
          resolvedValue: referenced.resolvedValue,
          referencedToken: referencedName,
        };
        cache.set(name, resolved);
        return resolved;
      }
    }

    const resolved: ResolvedToken = { ...token, resolvedValue: token.value };
    cache.set(name, resolved);
    return resolved;
  }

  return { tokens: flat.map((token) => resolve(token.name, [])) };
}
