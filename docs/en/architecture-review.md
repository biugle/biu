# Architecture Review

## Decision summary

This is an architecture-boundary assessment. The earlier 9.6/10 design score measures design boundaries and capability coverage, not the current source tree, consumer compatibility or production readiness. The engineering and enterprise-integration readiness score recorded on 2026-10-26 was **88/100**; the latest regression, score scope, unresolved risks and roadmap are in the [final delivery review](final-delivery-review.md). React 19 is an official stable release, and all eight React public packages use `^19.0.0` as their host peer range. Runtime rejects iframe APPs on the same Origin as the Portal; Preset publishes one CSS file. Source-size, Demo gzip and Changesets release-origin checks run in the delivery flow. Table resizing and request-cancellation lifecycles have focused regressions. The last recorded remote check (2026-10-26) found main unprotected, and the production cache fallback had not completed deployment acceptance at that time. Local checks cannot establish whether those external states have since changed, and do not replace target-environment validation of authentication, gateway headers, branch protection, monitoring, menu APIs and rollback.

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

Validate real gateway permission semantics, cross-origin policy, SPA fallback, monitoring delivery, remote APP compatibility and screenshot regression in the target platform. Keep Bridge payloads structured and non-sensitive. On 2026-10-25, the current homepage loaded `8a24170d.js`, `7f1f1676.js` and `412acc6b.js`, with no `b46ebfbd` reference in those bundles; the old hash URL nevertheless returned HTML cacheable for four hours. This strongly suggests a retired lazy chunk and the old SPA fallback caused deployment-version skew. The repository Vercel correction is not deployed. Without the first error line and source map, the exact `.reduce` cause remains unresolved and blocks production acceptance.
