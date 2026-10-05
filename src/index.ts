export {
  flattenTokens,
  isReferenceValue,
  mergeDocuments,
  tokenCategories,
  tokenTypes,
  type ColorValue,
  type DimensionValue,
  type DurationValue,
  type FlatToken,
  type ReferenceValue,
  type TokenDefinition,
  type TokenDocument,
  type TokenType,
  type ValidationIssue,
  type ValidationResult,
} from './core/index.js';

export { validateDocument, validateTokenValue } from './validator/index.js';
export {
  resolveDocument,
  resolveGroupExtensions,
  type ResolveResult,
  type ResolvedToken,
} from './resolver/index.js';
export {
  compileCss,
  compileCssWithStyleDictionary,
  createStyleDictionarySnapshot,
  referenceCompiler,
  styleDictionaryCompiler,
  type CompilerProvider,
  type CssCompileOptions,
} from './compiler/index.js';

export {
  applyTokenOverrides,
  resolveModePlan,
  type ModeAxisDefinition,
  type ModeOptionDefinition,
  type ModePlan,
  type ModeProfile,
  type ModeSelection,
} from './modes/index.js';
