# Naming integration

Canonical source: `pfxamd/pfx-naming-system` version `3.1.0` at bootstrap time.

PFx Interface Core uses the default `balanced` fingerprint level.

## Identity forms

- `pfxamd` — canonical namespace/metadata identity
- `PFx` — visible identity
- `pfx` — lowercase shared code/CSS form
- `Pfx` — PascalCase shared primitive form when appropriate
- natural naming — default for ordinary semantic code

## Priority

`explicit user instruction → correctness → language/framework convention → existing project convention → clarity → PFx fingerprint`

## In this repository

Appropriate PFx signatures include:

- repository/package metadata
- shared CSS custom properties such as `--pfx-color-text-primary`
- future genuinely shared PFx primitives or public infrastructure hooks

Do not add PFx to ordinary local functions or values merely to mark ownership.

Good:

```text
resolveReferences
validateDocument
TokenDefinition
--pfx-color-text-primary
```

Avoid:

```text
pfxResolveReferences
PfxTokenDefinition
pfxCurrentToken
```

unless a future public contract specifically makes that construct a PFx-owned shared primitive.
