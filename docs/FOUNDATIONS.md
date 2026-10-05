# PFx Foundations v0.1

PFx Foundations is the first reusable design layer built on top of the PFx token engine. It is data-first: projects and AI agents consume token roles through the existing public pipeline rather than through framework components.

## Active families

### Color

Primitive palette values are implementation material. Projects should normally consume semantic roles such as:

- `color.surface.*`
- `color.text.*`
- `color.border.*`
- `color.action.*`
- `color.focus.*`
- `color.state.*`

The current palette is a neutral, replaceable default. It is not PFx brand identity.

### Spacing

The primitive spacing scale is intentionally compact and predictable. Semantic roles separate control spacing from layout spacing so project code does not depend directly on arbitrary numeric steps.

### Typography

Typography uses system font stacks only. No external font is required by the core. Primitive families, weights, sizes, line heights, and tracking values feed semantic `body`, `heading`, and `code` roles.

### Motion

Motion foundations define reusable duration and easing primitives plus semantic duration/easing roles. Accessibility behavior is selected through the independent `motion` mode axis rather than by changing component code.

## Consumption rule

Project-facing UI should prefer semantic tokens. Primitive tokens are available for foundation authoring and exceptional cases, not as the default project API.

```text
primitive values
      ↓
semantic roles
      ↓
project identity / themes
      ↓
project UI
```

## What is deliberately deferred

- radius, borders, shadows, sizing, and z-index families
- component/design contracts
- framework components

Those enter only in later stages so the base remains small and testable.
