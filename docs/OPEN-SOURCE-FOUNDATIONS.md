# Open-source foundations

PFx Interface Core is an independent system, not a fork or renamed design system.

## DTCG

Role: token source semantics and interchange baseline.

Policy: use the stable 2025.10 concepts as the source model and keep PFx extensions isolated.

## Style Dictionary

Role: production transformation/compiler engine.

Pinned version: `5.5.5`.

Policy: Style Dictionary never owns the PFx public API or source semantics. PFx validates and resolves token data first, creates a resolved DTCG snapshot, then passes that snapshot through the isolated compiler adapter. PFx-specific transforms normalize vendor output where required.

The deterministic PFx reference compiler remains available for parity tests and future vendor replacement.

## Primer Primitives

Role: architecture reference for layered primitive/functional/component token thinking, deprecation discipline, generated outputs, and CI-oriented token changes.

Policy: do not inherit GitHub visual identity, names, palette, or project-specific conventions.

## Adobe Spectrum Design Data

Role: architecture reference for structural/relational validation, resolution, conformance, semantic diff, modes, and long-term evolution.

Policy: do not copy Spectrum's product-specific schema ecosystem or complexity into the bootstrap.

## PFx ownership

PFx owns:

- architecture boundaries
- token policy
- public interface
- validation policy
- resolver behavior
- compiler contract
- vendor normalization transforms
- promotion/governance rules
- naming-system integration

External projects are implementation foundations or research references, not the identity of the system.
