# PFx Interface Core — AI entry point

PFx Interface Core is an AI-first, machine-readable interface foundation. It is not a component library, page-template system, application framework, or visual brand.

Design authority belongs to the consuming project. PFx may provide primitives, semantic roles, accessibility constraints, modes, and validated capabilities, but it must not tell ChatGPT, Codex, or a project author what the interface should look like.

When using or modifying this repository:

1. Read `pfx-interface.manifest.json`.
2. Read `config/pfx-interface.default.json`, including its conformance declaration.
3. When the task involves visual foundations, read `config/pfx-foundations.v0.1.json` and `docs/FOUNDATIONS.md`.
4. When the task involves themes, accessibility preferences, density, or motion, read `config/pfx-modes.v0.1.json` and `docs/MODES.md`.
5. When the task involves interaction, focus, target sizing, reduced motion, responsive behavior, or accessibility, read `config/pfx-accessibility.v0.1.json` and `docs/ACCESSIBILITY.md`.
6. When considering a reusable Design Contract, read `docs/CONSUMER-VALIDATION.md` and `examples/validation/observations.json` before promoting anything.
7. Read only the relevant sections of `docs/STANDARD.md` and `docs/ARCHITECTURE.md`.
8. For naming, follow `docs/NAMING-INTEGRATION.md` and the canonical `pfxamd/pfx-naming-system` when accessible.
9. Treat schemas, executable validation, resolver behavior, and tests as stronger than prose when they disagree.
10. Keep token source data DTCG-aligned and machine-readable.
11. Do not make project code depend on compiler internals or vendor tooling.
12. Do not add a token family, foundation, contract, or abstraction only because one project needs it. Promote repeated stable patterns.
13. Keep ordinary functions, local variables, and domain names natural. Use PFx signatures only where shared PFx architecture owns the construct.
14. Never promote a visual composition recipe (navbar shape, hero layout, card treatment, page shell, visual hierarchy, art direction, or motion choreography) into the core merely to make project generation easier.
15. Run `npm run check` before considering a change complete.

Design decision boundary:

`project request + project context → project/AI visual decisions`

`PFx Interface Core → capabilities + constraints + validation only`

Priority:

`explicit user instruction → correctness → platform/language convention → existing project convention → clarity → PFx fingerprint`

## Task routing

- token definition/change → `tokens/`, `schema/`, relevant standard section
- shared token types/traversal/strict merge → `src/core/`
- structural/value validation rule → `src/validator/`
- aliases, JSON Pointer, `$root`, `$extends`, type resolution → `src/resolver/`
- output generation/vendor adapter → `src/compiler/`; use the PFx public compiler API, not Style Dictionary directly
- stable consumer API → `src/index.ts`
- fixtures/checks → `tests/`
- active foundation tokens → `config/pfx-foundations.v0.1.json`, `tokens/primitive/`, `tokens/semantic/`, `docs/FOUNDATIONS.md`
- mode selection/composition → `config/pfx-modes.v0.1.json`, `tokens/modes/`, `src/modes/`, `docs/MODES.md`
- accessibility policy → `config/pfx-accessibility.v0.1.json`, foundation tokens, `docs/ACCESSIBILITY.md`
- real consumer evidence → `examples/validation/`, `tests/consumer-validation.test.mjs`, `docs/CONSUMER-VALIDATION.md`
- future reusable element contract → promote only after the governance gate passes with cross-project evidence

Do not create a GUI unless explicitly requested in a future project decision.
