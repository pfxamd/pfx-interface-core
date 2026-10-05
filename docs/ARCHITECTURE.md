# Architecture

PFx Interface Core is a small AI-first system with machine-readable contracts, one stable public boundary, and one-way module dependencies.

## Core model

```text
Token data / config / schemas
          ↓
         core
       ↙      ↘
 validator  resolver
               ↓
            compiler
               ↓
        public API (src/index.ts)
               ↓
        projects / AI agents
```

Foundations and contracts are planned capabilities, not empty modules. They are added only after repeated real-project use passes the promotion gate.

## Repository layers

1. `config/` — machine policy and defaults.
2. `schema/` — machine-readable contracts.
3. `tokens/` — DTCG-aligned source tokens. Never generated CSS.
4. `src/core/` — shared token types and low-level traversal helpers.
5. `src/validator/` — structural validation and policy checks.
6. `src/resolver/` — alias resolution, missing-reference checks, type compatibility, and cycle detection.
7. `src/compiler/` — output generation boundary and future vendor adapters.
8. `src/index.ts` — stable consumer facade.
9. `tests/` — executable behavior and architecture checks.
10. `examples/` — executable proofs, never source of truth.
11. `docs/` — human explanation; executable/schema contracts outrank prose when they conflict.

## Dependency rules

- Token source files never depend on code.
- `core` has no dependency on validator, resolver, compiler, the public API, or vendors.
- `validator` may depend on `core` only.
- `resolver` may depend on `core` only.
- `compiler` may depend on `core` and `resolver`.
- `src/index.ts` may compose the public capabilities but must not contain business logic.
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

The bootstrap includes a minimal deterministic reference compiler to prove the pipeline without spreading custom compilation logic into other modules.

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
