# PFx Interface Core — AI entry point

PFx Interface Core is an AI-first, machine-readable interface foundation. It is not a component library, page-template system, application framework, or visual brand.

When using or modifying this repository:

1. Read `pfx-interface.manifest.json`.
2. Read `config/pfx-interface.default.json`, including its conformance declaration.
3. When the task involves visual foundations, read `config/pfx-foundations.v0.1.json` and `docs/FOUNDATIONS.md`.
4. Read only the relevant sections of `docs/STANDARD.md` and `docs/ARCHITECTURE.md`.
5. For naming, follow `docs/NAMING-INTEGRATION.md` and the canonical `pfxamd/pfx-naming-system` when accessible.
6. Treat schemas, executable validation, resolver behavior, and tests as stronger than prose when they disagree.
7. Keep token source data DTCG-aligned and machine-readable.
8. Do not make project code depend on compiler internals or vendor tooling.
9. Do not add a token family, foundation, contract, or abstraction only because one project needs it. Promote repeated stable patterns.
10. Keep ordinary functions, local variables, and domain names natural. Use PFx signatures only where shared PFx architecture owns the construct.
11. Run `npm run check` before considering a change complete.

Priority:

`explicit user instruction → correctness → platform/language convention → existing project convention → clarity → PFx fingerprint`

## Task routing

- token definition/change → `tokens/`, `schema/`, relevant standard section
- shared token types/traversal/strict merge → `src/core/`
- structural/value validation rule → `src/validator/`
- aliases, JSON Pointer, `$root`, `$extends`, type resolution → `src/resolver/`
- output generation/vendor adapter → `src/compiler/`
- stable consumer API → `src/index.ts`
- fixtures/checks → `tests/`
- active foundation tokens → `config/pfx-foundations.v0.1.json`, `tokens/primitive/`, `tokens/semantic/`, `docs/FOUNDATIONS.md`
- future reusable element contract → add a contract only after the promotion gate passes

Do not create a GUI unless explicitly requested in a future project decision.
