# PFx Interface Core

PFx Interface Core is an AI-first, machine-readable interface foundation for projects built with ChatGPT, Codex, or by hand.

It is not a UI kit and does not impose a visual identity. It defines reusable token rules, validation, reference/group resolution, compilation boundaries, and stable machine-readable guidance.

## Status

Hardened bootstrap with PFx Foundations v0.1 (`color`, `spacing`, `typography`, `motion`) and composable PFx Modes v0.1. Not yet a stable release and not yet claiming complete DTCG conformance.

## Core flow

```text
DTCG token sources
      ↓
validation
      ↓
mode composition
      ↓
reference resolution
      ↓
compiler boundary
      ↓
CSS / machine outputs
```


## Current DTCG surface

The core targets DTCG 2025.10 and currently tests `$root`, whole-token aliases, JSON Pointer/property references, `$extends`, type inheritance, circular-reference detection, and strict primitive validation. The exact supported surface is machine-readable in `config/pfx-interface.default.json`.

## Structure

```text
config/     machine policy
schema/     machine contracts
tokens/     source tokens
src/        executable core modules
tests/      behavior + architecture checks
examples/   executable proofs
docs/       human standards and governance
```

## AI workflow

Start with `AI-ENTRYPOINT.md` and `pfx-interface.manifest.json`. Foundation consumers should then read `config/pfx-foundations.v0.1.json`; contextual/theme work should also read `config/pfx-modes.v0.1.json`.

## Naming

PFx Interface Core follows the canonical `pfxamd/pfx-naming-system` policy. PFx signatures are used only for genuinely PFx-owned shared architecture. Ordinary semantic code stays naturally named.

## Setup

```bash
npm install
npm run check
```

`npm run check` cleans generated output, builds the TypeScript core, runs all tests, executes the reference pipeline, and cleans generated output again.

## Repository policy

- Private, unpublished package (`private: true`, `UNLICENSED`).
- GitHub Actions runs the same verification command on pushes to `main` and on pull requests.
- Generated `dist/` and example output are never source files.
- The bootstrap intentionally has no GUI and no framework dependency.
