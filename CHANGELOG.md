# Changelog

All notable changes to PFx Interface Core are recorded here.

## Unreleased

PFx Modes v0.1:

- Added independent `colorScheme`, `contrast`, `density`, and `motion` axes with deterministic composition order.
- Added dark color mapping, scheme-independent high contrast, compact/comfortable density, and reduced/none motion deltas.
- Added executable mode planning and safe token override composition that cannot create unknown semantic tokens or change token types.
- Promoted motion primitives and semantic motion roles into PFx Foundations.
- Added cross-axis mode regression coverage and a composed-mode example output.

PFx Foundations v0.1:

- Activated machine-readable foundation profile for color, spacing, and typography.
- Expanded neutral color and spacing scales without imposing a project accent identity.
- Added semantic surface, text, border, action, focus, disabled, control-spacing, and layout-spacing roles.
- Added system-font typography primitives and semantic body/heading/code roles.
- Added executable foundation integrity tests and example compilation coverage.

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
