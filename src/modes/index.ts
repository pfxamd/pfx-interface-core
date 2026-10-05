import {
  flattenTokens,
  isRecord,
  type TokenDefinition,
  type TokenDocument,
  type TokenType,
} from '../core/index.js';
import { validateDocument } from '../validator/index.js';

export interface ModeOptionDefinition {
  file?: string;
}

export interface ModeAxisDefinition {
  default: string;
  options: Record<string, ModeOptionDefinition>;
}

export interface ModeProfile {
  order: string[];
  axes: Record<string, ModeAxisDefinition>;
}

export type ModeSelection = Record<string, string>;

export interface ModePlan {
  selection: ModeSelection;
  files: string[];
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as unknown as T;
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    ) as unknown as T;
  }
  return value;
}

function replaceToken(document: TokenDocument, path: readonly string[], source: TokenDefinition): void {
  if (path.length === 0) throw new Error('Cannot override an empty token path.');

  let node: Record<string, unknown> = document;
  for (const segment of path.slice(0, -1)) {
    const child = node[segment];
    if (!isRecord(child)) {
      throw new Error(`Cannot locate mode override parent: ${path.join('.')}`);
    }
    node = child;
  }

  const leaf = path.at(-1);
  if (!leaf) throw new Error('Cannot override an empty token path.');
  node[leaf] = source;
}

function typeCompatible(baseType: TokenType | undefined, overrideType: TokenType | undefined): boolean {
  return overrideType === undefined || baseType === undefined || baseType === overrideType;
}

function assertValidSource(document: TokenDocument, label: string): void {
  const validation = validateDocument(document);
  if (validation.valid) return;
  const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
  throw new Error(`${label} is invalid:\n${details}`);
}

export function applyTokenOverrides(base: TokenDocument, ...overrides: TokenDocument[]): TokenDocument {
  assertValidSource(base, 'Base token document');
  const output = cloneValue(base);

  for (const override of overrides) {
    assertValidSource(override, 'Mode override document');
    const currentByName = new Map(flattenTokens(output).map((token) => [token.name, token]));

    for (const token of flattenTokens(override)) {
      const current = currentByName.get(token.name);
      if (!current) {
        throw new Error(`Mode override cannot add unknown token: ${token.name}`);
      }
      if (!typeCompatible(current.type, token.explicitType)) {
        throw new Error(
          `Mode override type mismatch at ${token.name}: expected ${current.type ?? 'unknown'}, received ${token.explicitType ?? 'unknown'}`,
        );
      }

      const replacement = cloneValue(token.source);
      if (replacement.$type === undefined && current.type !== undefined) {
        replacement.$type = current.type;
      }
      replaceToken(output, token.path, replacement);
    }
  }

  assertValidSource(output, 'Composed token document');
  return output;
}

export function resolveModePlan(profile: ModeProfile, selection: ModeSelection = {}): ModePlan {
  const knownAxes = new Set(Object.keys(profile.axes));
  for (const axis of Object.keys(selection)) {
    if (!knownAxes.has(axis)) throw new Error(`Unknown mode axis: ${axis}`);
  }

  const orderedAxes = new Set(profile.order);
  for (const axis of knownAxes) {
    if (!orderedAxes.has(axis)) throw new Error(`Mode axis is missing from order: ${axis}`);
  }

  const resolved: ModeSelection = {};
  const files: string[] = [];

  for (const axis of profile.order) {
    const definition = profile.axes[axis];
    if (!definition) throw new Error(`Mode order references an unknown axis: ${axis}`);

    const optionName = selection[axis] ?? definition.default;
    const option = definition.options[optionName];
    if (!option) throw new Error(`Unknown mode option for ${axis}: ${optionName}`);

    resolved[axis] = optionName;
    if (option.file) files.push(option.file);
  }

  return { selection: resolved, files };
}
