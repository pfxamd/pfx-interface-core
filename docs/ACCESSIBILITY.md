# PFx Accessibility Foundation v0.1

PFx Interface Core treats accessibility as a foundation-level contract for projects and AI agents. Tokens provide reusable values; they do not, by themselves, prove WCAG conformance.

## Baseline

The current machine policy targets WCAG 2.2 Level AA in `config/pfx-accessibility.v0.1.json`.

### Focus

Projects must preserve a visible keyboard focus indicator. PFx exposes:

- `color.focus.ring`
- `border.width.focus`
- `border.focus.offset`

The default focus width is 2 CSS pixels. This also gives a strong baseline toward WCAG 2.4.13 Focus Appearance, but that criterion is AAA and still requires project-level area and contrast verification.

### Target size

PFx exposes:

- `size.target.minimum` = 24 CSS pixels
- `size.target.enhanced` = 44 CSS pixels

The 24px token represents the WCAG 2.2 AA Target Size (Minimum) baseline. WCAG includes exceptions, so a project must still evaluate actual interactive targets and spacing.

### Motion

When `prefers-reduced-motion: reduce` applies, projects should select the PFx `motion: reduced` mode. The core does not detect or persist the preference itself.

### Focus not obscured

Sticky headers, footers, dialogs, and overlays must be checked in the project so focused controls are not entirely hidden by author-created content.

### Direction and layout

Foundations are intended to be consumed with CSS Logical Properties. Component-local responsiveness should prefer Container Queries; viewport-wide context should use Media Queries. Breakpoints remain build/platform rules rather than runtime token values.

## Verification boundary

PFx can provide safe defaults and machine-readable requirements. Real WCAG conformance remains a property of the final rendered project, content, interaction, and platform behavior.
