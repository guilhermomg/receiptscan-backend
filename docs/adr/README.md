# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for receiptscan-backend.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows this structure:

```markdown
# ADR-XXX: Title

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
What is the issue that we're addressing?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?
```

## Index

- [ADR-001: Use TypeScript for Backend Development](./001-use-typescript.md)
- [ADR-002: Adopt Layered Architecture Pattern](./002-layered-architecture.md)
- [ADR-003: Use Firebase for Authentication and Database](./003-firebase-backend.md)
- [ADR-004: Use OpenAI for Receipt Parsing](./004-openai-receipt-parsing.md)
- [ADR-005: Implement Zod for Runtime Validation](./005-zod-validation.md)

## Creating a New ADR

1. Copy the template from `000-template.md`
2. Number it sequentially (e.g., `006-new-decision.md`)
3. Fill in all sections
4. Update this index
5. Submit for review via Pull Request
