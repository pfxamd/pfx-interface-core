# PFx Interface Core repository instructions

Start with `AI-ENTRYPOINT.md` and `pfx-interface.manifest.json`.

This repository owns reusable interface foundations, not application architecture. Keep it AI-first, machine-readable, framework-agnostic, and free of speculative abstractions.

Rules:

- DTCG-aligned token files are source data. Generated CSS is output, never source of truth.
- Keep core, validation, mode composition, resolution, compilation, and the public API as explicit modules under `src/`.
- Keep dependencies one-way: `core` → `validator` → optional `modes` composition → `resolver` → `compiler` → public API composition.
- Keep vendor tooling behind `src/compiler/`; do not expose vendor APIs to consumers. Style Dictionary is pinned and must receive PFx-resolved snapshots rather than owning PFx resolution semantics.
- Consumers use `src/index.ts` as the stable boundary rather than importing internals.
- Prefer data/schema changes over hard-coded branches when a rule is declarative.
- Apply the PFx Naming System at `balanced` fingerprint level. PFx is a fingerprint, not a prefix tax.
- Treat `config/pfx-interface.default.json` as the machine-readable declaration of the supported conformance surface.
- Treat `config/pfx-modes.v0.1.json` as the source of truth for mode axes, defaults, and application order; do not invent combined theme files.
- Treat `config/pfx-accessibility.v0.1.json` as the machine policy for accessibility defaults and verification boundaries; never claim project conformance from token values alone.
- Treat `examples/validation/` as consumer evidence, not as source-of-truth foundation data.
- PFx provides design capabilities, not design decisions. Visual composition, navigation, hero/card patterns, hierarchy, art direction, and motion choreography belong to the consuming project and its context.
- Do not promote a Design Contract unless repeated usage is backed by materially different consumers and recorded evidence.
- Do not claim full DTCG conformance unless executable tests cover the claimed behavior.
- No GUI, React, Vue, Next.js, routing, data fetching, authentication, or business logic belongs in the core.
- Before completion, run `npm run check`.
