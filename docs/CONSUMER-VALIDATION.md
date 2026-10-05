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

## Pass criteria

Each consumer must:

1. use the same PFx public API and Style Dictionary-backed compiler;
2. compose project primitives without modifying core token files;
3. apply PFx modes without forking the core;
4. apply project identity through semantic overrides;
5. compile successfully;
6. reference only CSS variables actually emitted by PFx;
7. preserve the foundation and accessibility checks already enforced by the repository.

## Contract evidence

Repeated patterns are recorded in `examples/validation/observations.json`.

Two patterns currently have enough cross-project evidence to be considered candidates, not yet stable contracts:

- interactive control composition
- focus ring composition

Elevated surfaces also repeat, but the two consumers intentionally choose different shape roles. That pattern remains under observation rather than being generalized prematurely.

No Design Contract is introduced by the validation itself.
