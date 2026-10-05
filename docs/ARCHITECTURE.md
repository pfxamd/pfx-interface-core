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
       resolver
          ↓
       compiler
          ↓
  public API (src/index.ts)
          ↓
 projects / AI agents
```

Foundations are now active as a data layer (`config/pfx-foundations.v0.1.json` + token sources), not as a framework/component package. Contracts remain deferred until repeated real-project use passes the promotion gate.

## Repository layers

1. `config/` — machine policy, supported conformance surface, foundation profiles, and defaults.
2. `schema/` — machine-readable source contracts.
3. `tokens/` — DTCG-aligned source tokens. Never generated CSS.
4. `src/core/` — shared token types, traversal, strict document merging, and low-level helpers.
5. `src/validator/` — structural validation plus value/type validation rules.
6. `src/resolver/` — group extension, alias/reference resolution, type resolution, missing-reference checks, type compatibility, and cycle detection.
7. `src/compiler/` — output generation boundary and future vendor adapters.
8. `src/index.ts` — stable consumer facade.
9. `tests/` — executable behavior, DTCG compatibility, and architecture checks.
10. `examples/` — executable proofs, never source of truth.
11. `docs/` — human explanation; executable/schema contracts outrank prose when they conflict.

## Dependency rules

- Token source files never depend on code.
- `core` has no dependency on validator, resolver, compiler, the public API, or vendors.
- `validator` may depend on `core` only.
- `resolver` may depend on `core` and validator rules, never on compiler or vendors.
- `compiler` may depend on core, validator, and resolver.
- `src/index.ts` may compose public capabilities but must not contain domain logic.
- Vendor tooling belongs only behind `src/compiler/`.
- Consumers should use the public API rather than internal module paths.

## Why this is not a monorepo yet

The bootstrap is one private tool with one consumer boundary. Splitting empty or unpublished workspace packages would add metadata and dependency overhead without adding isolation. If future consumers require independently versioned packages, modules can be promoted to packages without changing their responsibilities.

## Vendor isolation

Preferred production token compiler: Style Dictionary.

It must sit behind a PFx-owned adapter:

```text
consumer
   ↓
PFx public API
   ↓
PFx compiler contract
   ↓
Style Dictionary adapter
```

The bootstrap includes a deterministic reference compiler to prove and test the pipeline without spreading vendor APIs through the repository.

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
