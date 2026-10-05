# Consumer validation

PFx Interface Core is validated against two materially different consumers rather than only token fixtures.

## Marketing consumer

Purpose: expressive service marketing site.

Uses:

- light color scheme
- comfortable density
- full motion
- project brand primitives
- project semantic identity overrides
- semantic layout, surface, action, typography and focus roles
- Container Query behavior in project CSS

Verified output:

- 171 resolved tokens
- 171 emitted PFx CSS variables
- 38 PFx variables consumed by project CSS
- 0 missing variable references

## Dashboard consumer

Purpose: dense operational dashboard.

Uses:

- dark color scheme
- compact density
- reduced motion
- different project brand primitives
- dense controls, sidebar, metrics and table layout
- semantic z-index, target size, surfaces and focus roles
- viewport Media Query behavior in project CSS

Verified output:

- 169 resolved tokens
- 169 emitted PFx CSS variables
- 35 PFx variables consumed by project CSS
- 0 missing variable references

## Pass criteria

Each consumer must:

1. use the same PFx public API and Style Dictionary-backed compiler;
2. compose project primitives without modifying core token files;
3. apply PFx modes without forking the core;
4. apply project identity through semantic overrides;
5. compile successfully;
6. reference only CSS variables actually emitted by PFx;
7. preserve the foundation and accessibility checks already enforced by the repository.

The validation run passed 71/71 repository tests.

## Core finding discovered by real consumption

The first validation run exposed a real composition bug: source token files in different directories can use different relative `$schema` strings, and `mergeDocuments()` incorrectly treated those file-local hints as conflicting token metadata.

The core was fixed rather than working around the problem in the examples. Root `$schema` is now treated as source-file metadata during composition, while other metadata conflicts remain strict. A regression test protects the behavior.

## Contract evidence

Repeated patterns are recorded in `examples/validation/observations.json`.

Two patterns currently have enough cross-project evidence to be considered candidates, not yet stable contracts:

- interactive control composition
- focus ring composition

Elevated surfaces also repeat, but the two consumers intentionally choose different shape roles. That pattern remains under observation rather than being generalized prematurely.

No Design Contract is introduced by the validation itself.
