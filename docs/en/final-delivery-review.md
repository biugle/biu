# Biu Final Delivery Review

This document records the final pre-release audit, score, completed items, remaining TODOs and GitHub Actions requirements. It is not a production deployment guarantee; authentication, permissions, gateways, domains and deployment security remain project responsibilities.

## Conclusion

Biu's agreed foundation, public packages, Demos, CLI, documentation and quality gates are complete and ready for local acceptance. Production SSO, domains/CSP, GitHub Secrets, npm/Vercel publishing and real business APIs remain deployment responsibilities. See the [comprehensive foundation/components/capabilities archive](biu-foundation-components-capabilities.md).

The latest fix unified the collapsed state of the standalone HTML APP. HTML, React and Vue APPs use the same `@biugle/biu-preset/sidebar` and `LayoutFrame`; collapse now means one 60px icon rail with one footer control. The header restore control appears only when the menu bar is hidden, avoiding duplicated controls and misalignment. The Components capability page is now one unified ordered catalog with interactive effects and a UI Table API reference; the former Pro page is only a compatibility alias, and dedicated pages cover file upload/list/preview, icon search/categories, the single Query package, Render Code and Watermark.

This regression pass also covers controlled Table pagination, virtual-scroll pagination isolation, Ellipsis overflow detection for nested text nodes, and the Components Dialog/Drawer viewport overlay and panel layering. Browser verification confirmed full 1280×720 overlay coverage, a viewport-height Drawer panel, sidebar recovery between 220px and the 60px collapsed rail, and complete menu text through the Components Tooltip.

The 2026-09-27 visual regression further consolidated centered Date/Time range separators, PageFilter floating labels without changing child-control dimensions, center alignment for multi-line FileItem rows, the unified Primary/Warning/Success palette (`#1677ff` / `#faad14` / `#52c41a`) and spacing between Overlay Demo action groups. It also corrected the RangeTimePicker connector to align with the actual Select control row and unified Popover, Popconfirm and Dropdown around a non-scrolling Radix portal shell; only long inner lists scroll, so first collision measurement cannot flash a scrollbar. Browser measurements confirmed 36px TextField and 38px Select controls inside PageFilter, with 0px center-line deviation for both range triggers and the time panel separator. The bottom Favorites popover opened upward inside a 491px viewport with its bottom at 944px, and Drawer showed its separate Cancel/Confirm footer buttons. Generated Demo `dist/` directories were cleaned, and port 9002 was restarted with a fresh `.biu` snapshot.

This regression also unified non-menu foundation pages: the default authentication page, Runtime status/error/remote retry states, Demo login, profile, change-password and workbar now use public `@biugle/react-components` controls, with a Runtime static-render contract test. The Icons and Watermark capability pages also reuse public `Button`, `TextField` and `InputNumber` controls for their interactive examples. Menu trees, tab context menus and navigation skeleton remain Preset-owned; real Portal account APIs, remote business pages, native file triggers and read-only error logs remain explicit boundaries.

The 2026-09-28 delivery regression added body-Portal interaction protection for the Table filter Drawer: Select and other portalled controls remain usable without accidentally closing their parent Drawer. PageFilter floating labels now have a subtle 4px radius without changing child-control dimensions. ProTable column settings persist the new order after dragging non-fixed columns, while fixed columns use a lock icon instead of the word “lock”. Account panels no longer render a duplicate content “Save” button; the Dialog footer Confirm action invokes the Portal-registered save/validation callback and keeps the Dialog open on validation failure. Form/Table Demo API tables now document every public property or method on its own row with a complete type, default, exact behavior and runnable example; this rule is recorded in `AGENTS.md` and the bilingual capability guide.

This range-control regression further simplified interaction: `RangeDatePicker` now uses only two consecutive calendar clicks—first click starts, second click completes, and the next click after a completed range starts over. Reversed dates are normalized into start/end order. `RangeTimePicker` has no start/end toggle; users operate the visible left/right hour-minute-second Select controls directly. When only one side is edited, the opposite side is preserved or filled with the value currently shown by its dropdown, and the emitted range remains chronological. New front-side/back-side regression coverage passed, and the behavior was rechecked in the restarted 9002 browser Demo.

The Table CRUD filter now follows the final layout contract: fields use roughly half-column width by default (capped at 240px), the inline area shows at most two rows, and overflow fields move into the complete filter Drawer. The More, Reset and Query controls are small, equal-width, right-aligned and vertically centered, with `secondary + outlined`, `secondary + contained` and `dark + contained` semantics respectively. The Drawer defaults to about 720px and reuses the same control dimensions and controlled state. Custom Toolbar actions retain icon plus text, while default table row actions explicitly use icon-only buttons. Fixed columns in column settings show only a lock icon and cannot be dragged; non-fixed columns expose a before/after dashed drop placeholder and synchronize the actual panel and table header order. Header text, sort/filter controls and resize handles share one center line.

The 2026-09-29 source regression strengthened the complete-order state in `TableColumnSettings`: hiding and showing a non-fixed column after moving it restores its moved relative position, with a new regression case passing. Release cleanup was then completed and the foundation packages and full Demo were rebuilt; root `pnpm check`, `pnpm test`, browser regression and the full `main-a` build passed, with 200 tests passing in this run. Ports 9001/9002 were stopped and restarted for browser verification. Generated `dist/` and `.biu/` directories remain local acceptance snapshots and are not committed.

The release notes are consolidated into `.changeset/foundation-capabilities.md`. All 18 public `@biugle/*` packages declare a minor release with the message: add component-library and development-library foundation capabilities, and extend the foundation capability range. Package versions remain Changesets-managed and were not edited manually.

## Automated regression

| Check                                             | Result                                                         |
| ------------------------------------------------- | -------------------------------------------------------------- |
| Public package build and typecheck                | PASS                                                           |
| Portal A/B, React, Vue, HTML and Custom typecheck | PASS                                                           |
| Unit tests                                        | PASS, 200 tests                                                |
| ESLint                                            | PASS                                                           |
| Prettier                                          | PASS after the targeted formatting fixes in this audit         |
| Knip                                              | PASS                                                           |
| Production dependency audit                       | PASS, no known vulnerabilities                                 |
| CLI/project scenarios                             | Historical PASS, 100 scenarios; sandbox rerun IPC-restricted   |
| Representative builds                             | PASS, 7 scenarios                                              |
| Full Demo build                                   | PASS                                                           |
| Local public-package packing                      | PASS, 18 packages written to a temporary directory; no publish |
| Local HTTP smoke test                             | Historical PASS; local listener is restricted in this sandbox  |
| Chinese/English resource keys                     | PASS, shared `MessageKey` plus regression coverage             |
| Legacy fixtures/layout/brand references           | PASS                                                           |

## Completed checklist

- [x] Portal Sidebar and Topbar layouts
- [x] Independent React, Vue and HTML APP integration
- [x] Independent React Custom mode
- [x] Hierarchical URLs, permission filtering and duplicate Code isolation
- [x] Zustand stores for preferences, auth, menus and tab sessions
- [x] Public `@biugle/biu-i18n`, `events`, `bridge`, `router` and `store` packages
- [x] Public `@biugle/icons`, `@biugle/render-code`, `@biugle/watermark`, `@biugle/react-components`, `@biugle/react-form`, `@biugle/react-table`, `@biugle/http` and `@biugle/tanstack-query` packages with the unified component catalog, Form.Item, useQueryTable, file preview, native code rendering, img fallback, Layout watermark integration and the migrated XHttp client
- [x] Runtime, Preset and Demo consume public package entries
- [x] Message, Tooltip, Modal, Drawer, `fire()`, error boundary and copy details
- [x] Non-menu foundation pages reuse public TextField, Button, Result, Alert and biuMessage controls; Demo account panels follow the same boundary
- [x] Lifecycle, navigation hooks, application events and Origin-validated Bridge
- [x] Startup/user-action update checks without polling or forced refresh
- [x] Changesets, npm release workflow, native Vercel Git deployment guide, Demo build workflow and CI workflow
- [x] ESLint, Prettier, EditorConfig, Husky, lint-staged and Knip
- [x] Chinese/English README, docs, contracts and production checklist
- [x] Logo, screenshots, Issue/PR templates, LICENSE, contribution and security policy
- [x] Demo fixture and obsolete workspace cleanup
- [x] Clean generated-artifact rebuild
- [x] Browser regression: Dialog/Drawer overlay, layer, viewport sizing, sidebar collapse/recovery, bottom popover collision and Ellipsis Tooltip
- [x] 2026-09-27 visual regression: range separators, PageFilter control dimensions, FileItem center lines, Primary/Warning/Success palette, Drawer footer and unified component API table
- [x] 2026-09-28 delivery regression: filter Drawer portal interaction, PageFilter label radius, ProTable non-fixed ordering and fixed-column lock icon, account Dialog footer submit contract, and per-property Form/Table API tables

## Remaining TODO

### Before first commit

- [ ] Inspect staged diff for tokens, cookies, passwords, internal domains and local user data
- [ ] Create the first `main` commit and push to `git@github.com:biugle/biu.git`
- [ ] Confirm GitHub Actions is enabled
- [ ] Configure `NPM_GIT_BIUGLE`; native Vercel Git deployment needs no Vercel token
- [ ] Protect `main` and require the CI `validate` job

### Current implementation gaps

None for the agreed delivery scope. The source, package tests, capability tables, full Demo builds and representative browser regression are complete. Playwright-level visual automation is an optional CI enhancement.

### Open-source hardening

- [ ] Enable Dependabot or Renovate
- [ ] Enable CodeQL
- [ ] Enable Secret Scanning and Push Protection
- [ ] Move npm publishing to Trusted Publishing/provenance later
- [ ] Add Playwright browser-level automation

### Production integration

- [ ] Connect real SSO, auth, permissions and menu APIs
- [ ] Configure HTTPS, CSP, `frame-ancestors` and SPA fallback
- [ ] Configure domains, CDN caching, old-asset retention and rollback
- [ ] Connect `onMonitorEvent` or `window.__BIU_MONITOR__`
- [ ] Verify exact `APP_URL` and `ALLOWED_ORIGINS` matches

## GitHub Actions configuration

Required repository secrets:

| Secret           | Purpose                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| `NPM_GIT_BIUGLE` | npm granular token for publishing `@biugle/*`, preferably publish-only |
| `GITHUB_TOKEN`   | Automatically provided by GitHub Actions                               |

Vercel uses native Git deployment, so `VERCEL_PROJECT_ID` and Vercel secrets are not required. Create six Vercel Projects linked to the repository and configure their domains, build commands and output directories. Fork PRs do not receive the npm publishing secret.

## Score

**90/100.** The deductions are for real-account release, production deployment/security integration and optional browser automation; source quality gates and local acceptance evidence pass.

## Agent archive rules

- Foundation capabilities must come from the matching public `@biugle/*` entry; Runtime, Preset and Demo must not duplicate implementations.
- HTML, Vue and React APPs share `LayoutFrame`/Preset. Differences belong to the Adapter or business page, never copied menu/collapse logic or responsive CSS.
- After Runtime, Preset, CLI or public package changes, rebuild and restart acceptance services; `.biu` is a temporary snapshot and is never committed.
- New UI text must update both locale resources and pass resource-key regression tests.
- Demo mocks belong under each app's `src/mock/`; the foundation only owns production contracts.
- Before delivery run `pnpm check`, `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm audit:unused`, `pnpm verify:scenarios` and `pnpm build:demo:all`; this source regression directly passed 200 tests, the full Demo build, typecheck, lint, format and Knip, and restarted 9001/9002 for browser verification. FormGroup sections, the Biu Table filter panel, range controls, Alert/Message, two-way Textarea resize, Select overflow Tooltips, Divider, Tree/Transfer, PageFilter child dimensions, FileItem center alignment, non-menu account-page component reuse, filter Drawer portal interaction, column-order controls, account Dialog footer submit, and narrow-browser regression are included in the evidence. Chart, RichText, Editor and Preview Server remain intentionally out of scope and are not in the base package.
