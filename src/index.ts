export {
  flattenTokens,
  mergeDocuments,
  tokenCategories,
  tokenTypes,
  type ColorValue,
  type DimensionValue,
  type FlatToken,
  type TokenDefinition,
  type TokenDocument,
  type TokenType,
  type ValidationIssue,
  type ValidationResult,
} from './core/index.js';

export { validateDocument } from './validator/index.js';
export { resolveDocument, type ResolveResult, type ResolvedToken } from './resolver/index.js';
export {
  compileCss,
  referenceCompiler,
  type CompilerProvider,
  type CssCompileOptions,
} from './compiler/index.js';
