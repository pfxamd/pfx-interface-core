# Architecture

PFx Interface Core is a small AI-first system with machine-readable contracts, one stable public boundary, and one-way module dependencies.

## Core model

```text
Token data / config / schemas
          ↓
         core
          ↓
       validator
          ↓
   modes (optional)
          ↓
       resolver
          ↓
       compiler
          ↓
  public API (src/index.ts)
          ↓
 projects / AI agents
```

Foundations are active as a data layer (`config/pfx-foundations.v0.1.json` + token sources). Accessibility is a parallel machine-policy layer (`config/pfx-accessibility.v0.1.json`) that references foundation tokens and project-level verification duties. Modes are an optional pre-resolution composition layer driven by `config/pfx-modes.v0.1.json`. Neither is a framework/component package. Contracts remain deferred until repeated real-project use passes the promotion gate.

## Repository layers

1. `config/` — machine policy, supported conformance surface, foundation/mode/accessibility profiles, and defaults.
2. `schema/` — machine-readable source contracts.
3. `tokens/` — DTCG-aligned source tokens. Never generated CSS.
4. `src/core/` — shared token types, traversal, strict document merging, and low-level helpers.
5. `src/validator/` — structural validation plus value/type validation rules.
6. `src/modes/` — deterministic mode planning and safe semantic-token override composition.
7. `src/resolver/` — group extension, alias/reference resolution, type resolution, missing-reference checks, type compatibility, and cycle detection.
8. `src/compiler/` — PFx-owned output boundary, deterministic reference compiler, and isolated vendor adapters.
9. `src/index.ts` — stable consumer facade.
10. `tests/` — executable behavior, DTCG compatibility, vendor parity, and architecture checks.
11. `examples/` — executable proofs, never source of truth.
12. `docs/` — human explanation; executable/schema contracts outrank prose when they conflict.

## Dependency rules

- Token source files never depend on code.
- `core` has no dependency on validator, resolver, compiler, the public API, or vendors.
- `validator` may depend on `core` only.
- `modes` may depend on `core` and validator only; it composes documents before reference resolution.
- `resolver` may depend on `core` and validator rules, never on modes, compiler, or vendors.
- `compiler` may depend on core, validator, and resolver.
- `src/index.ts` may compose public capabilities but must not contain domain logic.
- Vendor tooling belongs only behind `src/compiler/`.
- Consumers should use the public API rather than internal module paths.

## Why this is not a monorepo yet

The bootstrap is one private tool with one consumer boundary. Splitting empty or unpublished workspace packages would add metadata and dependency overhead without adding isolation. If future consumers require independently versioned packages, modules can be promoted to packages without changing their responsibilities.

## Vendor isolation

Production token compiler: Style Dictionary 5.5.5.

It sits behind a PFx-owned adapter:

```text
consumer
   ↓
PFx public API
   ↓
PFx validation + resolver
   ↓
resolved DTCG snapshot
   ↓
Style Dictionary adapter
   ↓
platform output
```

PFx resolves aliases, JSON Pointer references, `$root`, group extension, and mode composition before the vendor boundary. The adapter therefore receives a resolved snapshot rather than becoming the owner of PFx semantics. PFx-specific transforms normalize output details such as duration serialization and `$root` naming.

The deterministic reference compiler remains in the repository as a regression oracle and vendor-independence check.

## AI-first rule

AI context should stay narrow and routable:

```text
AGENTS.md
   ↓
AI-ENTRYPOINT.md
   ↓
manifest/config
   ↓
relevant schema/data/API
```

Do not solve machine-checkable rules with prompt text alone.
