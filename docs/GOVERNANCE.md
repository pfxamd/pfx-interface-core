# Governance

## Stability model

PFx Interface Core grows from stable repeated patterns, not speculative completeness.

## Change categories

### Data-only extension
Add a new valid token or profile without changing public behavior.

### Compatible capability
Add validation/compiler support without breaking existing valid sources.

### Contract change
Change a public token meaning, public API, resolver behavior, or output contract. Requires explicit versioning and migration notes.

### Removal
A public token or capability must be deprecated before removal once the project reaches stable releases.

## Promotion gate

Before adding a foundation or contract, answer all of the following:

1. Has the pattern appeared in more than one materially different project?
2. Is the semantic meaning stable?
3. Can the behavior be validated or tested?
4. Is it independent from one framework or visual brand?
5. Does adding it reduce repeated decisions rather than create a new abstraction burden?
6. Is the cross-project evidence recorded in `examples/validation/observations.json` or equivalent real-project evidence?

If not, keep it in the project layer.

Consumer validation creates candidates; it does not automatically promote them. A repeated recipe may still remain project-level when its parameters or semantics differ materially.

## Vendor changes

Changing Style Dictionary or another future vendor must not require token-source rewrites or consumer API rewrites. Vendor-specific code stays in a compiler adapter.

## Naming changes

`pfxamd/pfx-naming-system` is canonical for PFx fingerprint rules. This repository records the compatible version but must not fork the naming standard.


## Design-authority gate

A reusable capability is eligible for the core only when it remains useful without choosing the final visual composition for the consumer.

Do not promote a pattern when its main value is that it tells projects how to look. In particular, repeated use of a navbar layout, hero composition, card treatment, page shell, editorial rhythm, visual hierarchy, brand treatment, or motion choreography is not enough by itself to make it a core concern.

The governing rule is:

`PFx provides capabilities and constraints; the consuming project makes visual decisions.`
