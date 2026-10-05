# PFx Interface Core Standard — bootstrap

## Purpose

PFx Interface Core defines reusable interface decisions and machine contracts. It does not define product business logic or a fixed visual identity.

## DTCG target and conformance

The source model targets the stable DTCG 2025.10 specification. The bootstrap deliberately records its supported subset in `config/pfx-interface.default.json` rather than claiming complete DTCG conformance prematurely.

Currently supported and tested:

- `$value` tokens and group `$type` inheritance
- `$root` tokens
- curly-brace whole-token aliases
- JSON Pointer `$ref` token references
- JSON Pointer property-level references inside structured values
- chained references and circular-reference detection
- `$extends` group inheritance with local overrides
- DTCG primitive type constraints used by the core

Not yet claimed as complete:

- JSON Schema-style group `$ref` as an alternative spelling for `$extends`
- exhaustive semantic validation of every composite DTCG type
- complete production output coverage for every DTCG type

## Source naming policy

DTCG permits a wider set of token names, but PFx Interface Core intentionally uses a deterministic source subset so generated `--pfx-*` names remain stable and collision-resistant.

Ordinary token/group segments use lowercase kebab-case or numeric segments. `$root` is the only reserved token-name exception handled as part of the DTCG format.

## Token layers

### Primitive
Raw design values with no product meaning.

Examples:

- `color.palette.neutral.950`
- `space.4`

### Semantic
Meaningful reusable roles.

Examples:

- `color.text.primary`
- `color.surface.primary`
- `space.control.inline`

Projects should normally consume semantic roles rather than palette primitives.

### Contract
Element-level decisions promoted only after repeated use across projects.

Examples may eventually include control height or field focus-ring relationships. Contracts are not React/Vue components.

## Naming

PFx shared CSS tokens use `--pfx-*` according to the canonical PFx Naming System. Ordinary source identifiers stay natural.

Example:

```css
--pfx-color-text-primary
--pfx-space-control-inline
```

A DTCG `$root` token omits the literal `$root` segment in CSS output. For example `color.accent.$root` becomes `--pfx-color-accent`.

## Validation

Validation is split across structural and relational stages:

- structural validation — shape, names, metadata, declared type, literal value constraints
- relational resolution — missing aliases, group inheritance, cycles, resolved type inference, and resolved value/type compatibility

The compiler validates before emitting output.

## Resolution

Whole-token aliases may omit `$type`; in that case the resolved target type takes precedence over a parent group's `$type`, matching DTCG rules.

JSON Pointer references can target complete token values or individual properties. Property-level references are recursively resolved before output.

Group `$extends` performs inherited deep merge with local replacement at the same token path. Circular group inheritance is an error.

## Compilation

Compilation is an output concern, never a token-source concern.

The reference CSS compiler converts supported resolved tokens to PFx custom properties and handles DTCG color spaces with valid CSS Color syntax. Generated CSS must not be edited as source.

The reference compiler is intentionally not the final production transformation engine. Style Dictionary remains the preferred production adapter behind the PFx compiler boundary.

## Modes and themes

Modes are independent axes rather than combinatorial theme files:

- color scheme
- contrast
- density
- motion

The machine source of truth is `config/pfx-modes.v0.1.json`. Default choices carry no override file; non-default choices provide delta token documents. `resolveModePlan()` determines deterministic application order and `applyTokenOverrides()` applies only type-compatible replacements to existing tokens.

The core must not create files such as `dark-high-contrast-compact.json`. Cross-axis behavior is expressed through semantic aliases whenever possible.

## Promotion rule

A new foundation or contract enters the core only when it is:

- reusable across materially different projects
- stable enough to name semantically
- not framework-specific
- testable
- not a one-project exception

## Non-goals

PFx Interface Core does not own:

- pages
- navigation
- routing
- API/data fetching
- authentication
- application state
- business logic
- a component library
- a visual brand
- a GUI for the core itself
