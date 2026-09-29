# Architecture Review

## Decision summary

biu is suitable as an enterprise frontend foundation when the host platform owns authentication, permissions, deployment headers and monitoring integration. The foundation deliberately does not contain a business API client, token storage, a forced micro-frontend runtime or a Demo account.

## Strengths

- Clear package boundaries: CLI, Runtime, Preset, Store, Router, Bridge, Events, i18n, UI, Form, Table, HTTP and React Adapter.
- Progressive integration for React, Vue, HTML and legacy iframe applications.
- Complete menu-chain URL identity, permission filtering and independent Portal/APP deployment.
- Scoped Zustand state and an Origin-checked Bridge protocol.
- Public UI and lifecycle contracts that can be reused by Custom and independent APPs.
- Reproducible builds with Rsbuild, Changesets, CI, Vercel and Knip.

## Responsibilities outside the foundation

SSO, gateway policy, HTTP security headers, backend permissions, observability SDKs, business data and deployment rollback remain project/platform responsibilities. This boundary keeps the foundation reusable and avoids hard-coded enterprise assumptions.

## Risks to review before production

Validate real gateway permission semantics, cross-origin policy, SPA fallback, monitoring delivery, remote APP compatibility and screenshot regression in the target platform. Keep Bridge payloads structured and non-sensitive.
