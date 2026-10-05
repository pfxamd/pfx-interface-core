# PFx Interface Core Standard — bootstrap

## Purpose

PFx Interface Core defines reusable interface decisions and machine contracts. It does not define product business logic or a fixed visual identity.

## Source model

The token source follows DTCG 2025.10 concepts:

- `$type`
- `$value`
- `$description`
- aliases using `{path.to.token}`
- optional `$extensions`
- optional deprecation metadata

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

## Validation

Validation is split into two concepts:

- structural validation — token shape, type presence, value shape
- relational validation — missing aliases, cycles, type mismatches, layer constraints

The bootstrap executable validator implements the first essential subset and alias checks are enforced by the resolver.

## Resolution

Aliases are whole-value references in the bootstrap. Resolution must:

- find the referenced token
- preserve the consumer token identity
- detect missing references
- detect cycles
- keep output deterministic

## Compilation

Compilation is an output concern, never a token-source concern.

The CSS compiler converts resolved shared tokens to PFx custom properties. Generated CSS must not be edited as source.

## Modes and themes

Modes are independent axes rather than combinatorial theme files:

- color scheme
- contrast
- density
- motion

The detailed resolver model is intentionally deferred until the base token pipeline is proven.

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
