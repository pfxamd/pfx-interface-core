# PFx Modes v0.1

PFx Modes applies contextual changes as independent axes over the same semantic foundation. It does not create one file for every possible theme combination.

## Axes

Application order is fixed:

```text
base foundations
      ↓
colorScheme
      ↓
contrast
      ↓
density
      ↓
motion
```

Current options:

- `colorScheme`: `light` / `dark`
- `contrast`: `normal` / `high`
- `density`: `default` / `compact` / `comfortable`
- `motion`: `full` / `reduced` / `none`

Defaults do not need override files. Only choices that change the foundation carry a delta document.

## Composition

`resolveModePlan()` validates a requested selection and returns override files in deterministic axis order. `applyTokenOverrides()` applies those documents only to tokens that already exist in the base foundation.

A mode cannot silently create a new semantic token or change its type.

## Contrast independence

High contrast deliberately points border, secondary text, muted text, and focus roles back to the active semantic text role. It therefore works after both light and dark color schemes without a separate `dark-high-contrast` theme.

## Density

Density changes control padding and common layout gaps. Section spacing remains stable so density does not unexpectedly reshape whole page composition.

## Motion

`full` uses the base semantic durations. `reduced` removes fast incidental motion and shortens longer transitions. `none` maps semantic durations to the zero-duration primitive.

Projects must still use appropriate platform accessibility signals such as `prefers-reduced-motion` when selecting the motion axis.

## Non-goals

Modes do not own:

- project brand colors
- component contracts
- application settings UI
- persistence of a user's preference
- operating-system preference detection
