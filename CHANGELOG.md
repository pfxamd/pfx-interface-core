# Changelog

All notable changes to PFx Interface Core are recorded here.

## Unreleased

Hardening pass:

- Added DTCG `$root`, JSON Pointer/property references, alias type inference, and `$extends` group resolution.
- Added circular group/reference detection and resolved value/type checks.
- Enforced PFx deterministic source naming and strict duplicate-token merges.
- Corrected DTCG primitive type validation, including color ranges and dimension units.
- Removed non-DTCG `boolean` and `string` token types from the bootstrap type surface.
- Expanded CSS color serialization and made compilation reject invalid token sources.
- Expanded regression coverage from 12 to 35 tests.

## 0.1.0-dev

Initial bootstrap foundation:

- AI-first repository entry points and machine manifest.
- DTCG-aligned primitive and semantic token sources.
- Modular core, validator, resolver, and compiler boundary.
- PFx Naming System integration at balanced fingerprint level.
- Reference CSS compiler for pipeline verification.
- Architecture, governance, schema, and regression checks.
- GitHub verification workflow.
