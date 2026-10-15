# Biu Final Delivery Review

This document records the final pre-release audit, score, completed items, remaining TODOs and GitHub Actions requirements. It is not a production deployment guarantee; authentication, permissions, gateways, domains and deployment security remain project responsibilities.

## Conclusion

Functional regression, the local release gate and current browser acceptance pass; a healthy acceptance tab loads the Standard Table page. Eleven foundation source files still exceed the repository's 800-line rule, so do not treat this candidate as ready for a formal commit or release until those modules are split or reviewed exceptions are documented. Production SSO, domains/CSP, GitHub Secrets, npm/Vercel publishing and real business APIs remain deployment responsibilities. See the [comprehensive foundation/components/capabilities archive](biu-foundation-components-capabilities.md).

The latest fix unified the collapsed state of the standalone HTML APP. HTML, React and Vue APPs use the same `@biugle/biu-preset/sidebar` and `LayoutFrame`; collapse now means one 60px icon rail with one footer control. The header restore control appears only when the menu bar is hidden, avoiding duplicated controls and misalignment. The Components capability page is now one unified ordered catalog with interactive effects and a UI Table API reference; the former Pro page is only a compatibility alias, and dedicated pages cover file upload/list/preview, icon search/categories, the single Query package, Render Code and Watermark.

This regression pass also covers controlled Table pagination, virtual-scroll pagination isolation, Ellipsis overflow detection for nested text nodes, and the Components Dialog/Drawer viewport overlay and panel layering. Browser verification confirmed full 1280×720 overlay coverage, a viewport-height Drawer panel, sidebar recovery between 220px and the 60px collapsed rail, and complete menu text through the Components Tooltip.

The 2026-09-27 visual regression further consolidated centered Date/Time range separators, PageFilter floating labels without changing child-control dimensions, center alignment for multi-line FileItem rows, the unified Primary/Warning/Success palette (`#1677ff` / `#faad14` / `#52c41a`) and spacing between Overlay Demo action groups. It also corrected the RangeTimePicker connector to align with the actual Select control row and unified Popover, Popconfirm and Dropdown around a non-scrolling Radix portal shell; only long inner lists scroll, so first collision measurement cannot flash a scrollbar. Browser measurements confirmed 36px TextField and 38px Select controls inside PageFilter, with 0px center-line deviation for both range triggers and the time panel separator. The bottom Favorites popover opened upward inside a 491px viewport with its bottom at 944px, and Drawer showed its separate Cancel/Confirm footer buttons. Generated Demo `dist/` directories were cleaned, and port 9002 was restarted with a fresh `.biu` snapshot.

This regression also unified non-menu foundation pages: the default authentication page, Runtime status/error/remote retry states, Demo login, profile, change-password and workbar now use public `@biugle/react-components` controls, with a Runtime static-render contract test. The Icons and Watermark capability pages also reuse public `Button`, `TextField` and `InputNumber` controls for their interactive examples. Menu trees, tab context menus and navigation skeleton remain Preset-owned; real Portal account APIs, remote business pages, native file triggers and read-only error logs remain explicit boundaries.

The 2026-09-28 delivery regression added body-Portal interaction protection for the Table filter Drawer: Select and other portalled controls remain usable without accidentally closing their parent Drawer. PageFilter floating labels now have a subtle 4px radius without changing child-control dimensions. ProTable column settings persist the new order after dragging non-fixed columns, while fixed columns use a lock icon instead of the word “lock”. Account panels no longer render a duplicate content “Save” button; the Dialog footer Confirm action invokes the Portal-registered save/validation callback and keeps the Dialog open on validation failure. Form/Table Demo API tables now document every public property or method on its own row with a complete type, default, exact behavior and runnable example; this rule is recorded in `AGENTS.md` and the bilingual capability guide.

This range-control regression further simplified interaction: `RangeDatePicker` now uses only two consecutive calendar clicks—first click starts, second click completes, and the next click after a completed range starts over. Reversed dates are normalized into start/end order. `RangeTimePicker` has no start/end toggle; users operate the visible left/right hour-minute-second Select controls directly. When only one side is edited, the opposite side is preserved or filled with the value currently shown by its dropdown, and the emitted range remains chronological. New front-side/back-side regression coverage passed, and the behavior was rechecked in the restarted 9002 browser Demo.

The Table CRUD filter now follows the final layout contract: fields use roughly half-column width by default (capped at 240px), the inline area shows at most two rows, and overflow fields move into the complete filter Drawer. The More, Reset and Query controls are small, equal-width, right-aligned and vertically centered, with `secondary + outlined`, `secondary + contained` and `dark + contained` semantics respectively. The Drawer defaults to about 720px and reuses the same control dimensions and controlled state. Custom Toolbar actions retain icon plus text, while default table row actions explicitly use icon-only buttons. Fixed columns in column settings show only a lock icon and cannot be dragged; non-fixed columns expose a before/after dashed drop placeholder and synchronize the actual panel and table header order. Header text, sort/filter controls and resize handles share one center line.

The 2026-09-29 source regression strengthened the complete-order state in `TableColumnSettings`: hiding and showing a non-fixed column after moving it restores its moved relative position, with a new regression case passing. Release cleanup was then completed and the foundation packages and full Demo were rebuilt; root `pnpm check`, `pnpm test`, browser regression and the full `main-a` build passed, with 200 tests passing in this run. Ports 9001/9002 were stopped and restarted for browser verification. Generated `dist/` and `.biu/` directories remain local acceptance snapshots and are not committed.

The first release was maintained by `.changeset/first-formal-release.md`; `changeset version` has consumed it and written the release notes into each package `CHANGELOG.md`. All 18 public `@biugle/*` packages are now on the formal `1.0.0` version. No alpha, beta, rc, snapshot or canary versions remain; package versions were generated by Changesets rather than hand edited.

The 2026-10-08 1.0.0 release-candidate regression passed `pnpm check`, `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm audit:unused` and `pnpm build:demo:all`. Portal A/B, React, Vue, HTML and Custom Demo builds passed; `git diff --check` passed; Changesets status confirms all 18 public packages are in the major release plan. `docs/specs/` is absent, and generated `dist/` and `.biu/` directories remain local runtime snapshots only and are not committed.

The 2026-10-17 local acceptance was repeated after cleaning old generated output: `pnpm check`, `pnpm test`, `pnpm build:demo` and `git diff --check` all passed; the only build message was the existing outdated Browserslist data notice. Browser regression covered `ComponentUIShowcase`, `FormShowcase`, `TableShowcase`, `StandardTableTabsShowcase` and `TableResizeShowcase`; the component page, Form fields, default-Chinese Table, 20-row pagination, 110 sanitized records, advanced-filter Drawer input/select synchronization, and all five column/row resize cases were visible and interactive. The old 9001 process was stopped, exact generated directories were moved to the system Trash, the workspace was rebuilt, and the service was restarted from the new snapshot at `http://localhost:9001`. The 13 historical `!important` occurrences remain only for Preset host/overlay boundaries and Form error states; none were added in this pass.

The 2026-10-20 final regression fixed last-column consecutive-resize drift: resizing now starts from the rendered header width, the last column keeps a trailing handle, and compensation columns absorb the delta on every drag. All 53 `@biugle/react-table` tests passed; browser verification moved the last column from 447px to 402px and then 367px across two consecutive drags without jumping into the previous column. `TableShowcase` and `StandardTableTabsShowcase` now share the same page layout; their action column is 222px wide on desktop and 60px below 500px, with 30px hit areas and 15px icons. `ComponentUIShowcase` loads the first viewport immediately and mounts later sections as they enter the scroll range; a full scroll produced no browser errors or warnings. The CLI factory verified 100 distinct combinations and 7 representative builds. Fresh acceptance snapshots are running at `http://localhost:9001`, `http://localhost:8001` and `http://localhost:8002`; `.biu/`, `dist/`, dependency directories and caches remain ignored local artifacts. Before the first release diff is committed, `pnpm changeset status` reports the already versioned package edits as pending worktree changes; committing that release diff returns the tree to the expected clean state, so no extra 1.0.1 changeset is needed.

## 2026-10-22 column sizing, filters and batch input regression

Column resizing now uses one numeric layout and controlled commit model. Resizing ordinary columns and distributing unused space exclude fixed, action, selection and expansion columns. The final column retains the accepted width, while other ordinary columns fill the remaining space by default. `fillRemainingSpace=false`, `elasticColumn=false` or `scroll.x="max-content"` use exact content widths. Focused regressions cover bounds, consecutive resizing, RTL, rejected controlled commits, equivalent prop copies during a drag, cancellation on external changes, and listener/selection cleanup when callbacks throw.

PageFilter no longer creates an implicit Grid track for actions. Fields fill balanced tracks measured against the container and actions, with at most six columns and two rows by default. The advanced Drawer shares controlled values, retains collapsed fields when visible fields are excluded, and remains mounted while an open Drawer is resized to a wider viewport. Standard pages now include Filter/Detail help icons and a ProTextField batch keyword example. Inline and batch editing share input filtering; line breaks are default separators, with optional whitespace and English/Chinese commas.

Browser measurements compare each label text span with its help SVG: the three Table examples deviate by about 0.008px, three Filter examples by 0px, two Detail examples by less than 0.001px, and seven Form.Item plus two Form.List examples by 0px. All five TableShowcase filter fields are 335px wide. Dragging the final ordinary column from 273px to its 48px minimum retains 48px after release and a parent rerender; other ordinary columns fill the 1027px table viewport. Name/action columns remain 180px and selection/expansion columns remain 42px. The action header and body share identical widths and physical positions.

Actual mouse comparison verifies both filling modes: the default mode shrinks the final column from 467px to 367px while the module column grows from 200px to 300px and the table remains 1027px. Disabled filling retains exact content width. Resizing the right fixed column from its inner left edge changes 180px to 130px while preserving the same header/body right boundary; subsequent ordinary-column resizing retains its 130px width. Applying “北岸，云港\n沈禾” returns 52 records matching regions or owners. At 390px, the action column is 60px and the page width remains 390px; clearing the Drawer synchronizes the inline field and restores 110 records. All five ProTextField component examples are 30px tall, with working batch, read-only, disabled and separator options and no console errors or warnings. The Demo translation boundary retains stable child keys, and Checkbox examples use the public label contract.

The final fresh snapshot passed actual RTL mouse regression: with filling disabled, the action column changes from 180px to 130px through its physical inner left edge, while both header and body remain anchored to the viewport right boundary. The ordinary module column grows from 200px to 240px with its left boundary moving 40px left; the fixed name and action columns remain 180px and 130px. The final ordinary column shrinks from 160px to its 120px minimum and retains that result. RTL handles use physical left/right based on actual direction, and exact short tables leave the gap between left fixed and ordinary columns. TableShowcase retains the final 293px to 233px ordinary-column change across parent selection rerenders, with both action header and body at 180px. All four label-help variants were measured again with a maximum center deviation below 0.01px. A fresh 390px viewport confirms a 60px action column, one More button per row and no outer horizontal overflow. The final run passed all 322 tests (84 Table tests), builds for all six Demos, type checks, ESLint, Knip and formatting.

## 2026-10-23 action-column breakpoints, pagination and dev-server shutdown

The action column now owns three responsive sizes based on browser viewport width: below 560px it uses 60px and `maxCount=1`; 560–799px uses 160px and `maxCount=3`; from 800px it uses 190px and `maxCount=5`. `maxCount` includes the More slot, so these tiers expose 0, 2 and 4 direct actions. `ButtonList` remains generic and has no size variants; an explicit caller limit takes precedence. Browser measurements at 500, 559, 560, 700, 799, 800 and 1000px verified the width, attribute and visible buttons at both breakpoints. The standard Table page remains open at the default viewport for acceptance.

Pagination was also checked at the 560px and 800px breakpoints: below 560px it keeps the existing compact layout; 560–799px hides the total-record summary, keeps the full page-number buttons and sets the page-size and jump controls to 45px; from 800px it uses the standard desktop layout. The behavior is reflected in the Standard Table, Standard Table Tabs and EditableTable demos.

The development-memory review found a concrete source of process accumulation. When `--apps` spawned child applications, the CLI's SIGINT/SIGTERM handlers stopped those children but consumed the parent dev server's default exit signal. The CLI now stops child apps and re-delivers the original signal to the parent, with a regression test. After restart, port 9001 has one listener. Two short samples showed RSS fall from about 88MB to 77MB with CPU around 0.7%, so no sustained growth was observed. The standard Table page has 2,298 DOM nodes, 21 rows and 441 cells; the browser did not expose its JS heap metric, so this does not establish a long-term memory curve. The `--apps` shutdown bug could leave services behind across repeated starts; the current single-Portal service has no duplicate instance, and this evidence does not attribute every OOM to that one cause.

`@biugle/biu-cli` is now on formal stable version 1.0.1. Its 17 tests, type check and package build passed; targeted ESLint, Prettier and `git diff --check` passed as well. Changesets generated the stable changelog without a beta prerelease. npm was not published directly; the configured GitHub Actions workflow remains the release path after repository Secrets are available.

## 2026-10-23 Runtime default-locale request-loop regression

The development-memory review found a second concrete loop. When `localeUrl` is configured and `locales` is omitted, Runtime copied the default locale list on every render. Loading the locale resource updates revision state, which changed the locale-options reference and restarted the fetch effect for the same locale. In one earlier observation window of about 19 seconds, `demo-locale.json?locale=zh-CN` was requested about 250 times; the browser task manager showed roughly 133% CPU and 13.1GB for that page, with about 593 DOM nodes and a 131MB JS heap. This evidence matches a sustained request loop but does not establish that every development OOM has the same cause.

Runtime now keeps the default locale list, supported locale codes and valid locale options referentially stable, so the resource effect does not restart after its own successful state update. A JSDOM integration regression mounts the real `BiuShell` with default locales and asserts one locale request across resource loading and the resulting rerender; it passes. Some older In-app Browser tabs still show Chromium crash pages, but a healthy tab later reopened `StandardTablePageShowcase`; its filter area, toolbar, full table and pagination rendered normally, and the three standard Table pages plus resize cases passed browser regression. The restarted 9001, 8001 and 8002 services all return HTTP 200, with one listener per port. At 21m56s and 22m13s after startup, RSS stayed near 77/64/64MiB, CPU was 0%, system available memory was about 52%, and no memory throttling was observed. This short observation measures server processes, not browser renderers or long-term memory growth; the cause of the old renderer crashes remains unconfirmed.

Changesets versioned the affected packages as stable releases: `@biugle/biu-cli` 1.0.2, `@biugle/biu-store` 1.0.1, `@biugle/biu-runtime` 1.0.3 and its dependent `@biugle/biu-preset` 1.0.3. The locale request-loop fix is in Runtime 1.0.2; Runtime was then bumped to 1.0.3 for the Store dependency update, and Preset was aligned to 1.0.3. The source Changeset was consumed by `changeset version`; package, changelog and lockfile changes remain uncommitted. The repository has no prerelease configuration or prerelease suffix on current package versions. npm was not published in this run. A read-only npm registry check confirmed that none of the 18 stable candidates appeared in the published version lists; existing stable versions currently top out at 0.6.0 or 0.4.0. npm may retain early temporary prerelease versions in package history; published history cannot be rewritten, and this release only publishes stable candidates that have not been published before.

## Automated regression

| Check                                             | Result                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Public package build and typecheck                | PASS                                                                                          |
| Portal A/B, React, Vue, HTML and Custom typecheck | PASS                                                                                          |
| Unit tests                                        | PASS, 346 tests                                                                               |
| ESLint                                            | PASS                                                                                          |
| Prettier                                          | PASS after the targeted formatting fixes in this audit                                        |
| Knip                                              | PASS                                                                                          |
| Production dependency audit                       | PASS, no known vulnerabilities                                                                |
| CLI/project scenarios                             | PASS, 100 combinations and 7 representative builds                                            |
| Representative builds                             | PASS, 7 scenarios                                                                             |
| Full Demo build                                   | PASS                                                                                          |
| Local public-package packing                      | PASS, 18 packages written to a temporary directory; no publish                                |
| Local HTTP smoke test                             | PASS, 9001/8001/8002 returned HTTP 200; a fresh acceptance tab loaded the Standard Table page |
| Chinese/English resource keys                     | PASS, shared `MessageKey` plus regression coverage                                            |
| Legacy fixtures/layout/brand references           | PASS                                                                                          |

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
- [ ] Review the existing local commit and working tree; push the reviewed branch after structural debt is cleared
- [ ] Confirm GitHub Actions is enabled
- [ ] Configure `NPM_GIT_BIUGLE`; native Vercel Git deployment needs no Vercel token
- [ ] Protect `main` and require the CI `validate` job

### Current implementation gaps

The automated functional gates and current browser regression pass, but eleven foundation source files still exceed the 800-line architecture rule. A fresh acceptance tab loads the Standard Table page; some older tabs remain Chromium crash pages, with the renderer cause unconfirmed. The three standard Table pages were checked at all three breakpoints, along with Table/Filter/Detail/Form Tooltip alignment and real column/row resizing. The stale tabs do not indicate a current service failure. See the final audit section for the file list and release checklist.

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

**88/100.** The deductions include the 11 unresolved source-size violations and release-account, production deployment/security and browser automation work that has not been completed. Current browser acceptance passed.

## Agent archive rules

- Foundation capabilities must come from the matching public `@biugle/*` entry; Runtime, Preset and Demo must not duplicate implementations.
- HTML, Vue and React APPs share `LayoutFrame`/Preset. Differences belong to the Adapter or business page, never copied menu/collapse logic or responsive CSS.
- After Runtime, Preset, CLI or public package changes, rebuild and restart acceptance services; `.biu` is a temporary snapshot and is never committed.
- New UI text must update both locale resources and pass resource-key regression tests.
- Demo mocks belong under each app's `src/mock/`; the foundation only owns production contracts.
- Before delivery run `pnpm verify`; this source regression passed 346 tests, public-package packing, the full Demo build, type checks, lint, format, Knip, production dependency audit and CLI scenarios. Earlier browser regression records cover FormGroup sections, the Biu Table filter panel, range controls, Alert/Message, two-way Textarea resize, Select overflow Tooltips, Divider, Tree/Transfer, PageFilter child dimensions, FileItem center alignment, non-menu account-page component reuse, filter Drawer portal interaction, column-order controls, account Dialog footer submit and narrow-browser behavior. Chart, RichText, Editor and Preview Server remain intentionally out of scope and are not in the base package.

## 2026-10-23 Follow-up Regression

- The action-column viewport contract was verified: `<560px` uses `60px / maxCount 1`, `560–799px` uses `160px / maxCount 3`, and `≥800px` uses `190px / maxCount 5`. `maxCount` includes the overflow button, so these render as “More only,” “2 actions + More,” and “4 actions + More.” `ButtonList` receives a numeric limit and an explicitly configured `maxCount` takes precedence. The three standard pages no longer duplicate the action limit and own no page CSS; the only inline sizing on the standard page is for a progress bar inside a table cell.
- Pagination was checked visually and through the DOM at 500px, 700px and 1280px: below 560px it shows only the current page; at 560–799px it hides the range/total while retaining page numbers; at 800px and above it uses the standard layout. The page-size and quick-jump controls are 45px below 800px and 90px on desktop.
- Fixed the CLI `--apps` shutdown path so `SIGINT`/`SIGTERM` stops child apps and is re-raised to the parent dev server, with a regression test to prevent orphaned listeners after repeated starts. During acceptance, port 9001 had one Node listener (about 113 MB RSS) and returned HTTP 200. An older In-app Browser tab crashed during a viewport change; a fresh tab loaded the page and passed desktop acceptance. This did not indicate local-server memory exhaustion, though the renderer crash cause remains undetermined.
- Affected public packages are versioned as stable `1.0.1`; Changesets entries are in each package changelog, with no beta prerelease. npm publishing remains delegated to GitHub Actions after repository secrets are configured.

## 2026-10-23 final CLI, package and release-candidate audit

CLI creation regression covers 100 distinct combinations of project names, option spelling/casing/placement, Portal/APP presets and locales. Seven representative builds cover Portal Sidebar/Topbar and APP Sidebar/Blank/Dashboard/Mobile/Custom across local, dev, test, pre and prod environments. Scenario projects use a unique `.scenario-work-*` directory under the repository so the CLI can discover the workspace; the script removes only the directory it created, and no scenario directory remained after the passing run. Both source and packed `biu --version` output match `packages/cli/package.json`. The repository has one CLI scenario verifier and one public-package verifier; `build:demo:all:built` reuses Demo builds after `pnpm check` has already built the foundation, and `examples/dev-demo` delegates foundation builds to the root script instead of maintaining a duplicate package list.

The package verifier packs all 18 public packages and checks declared export/bin targets, README/LICENSE files, package versions, workspace dependency replacement and generated-file leakage. Temporary tarballs are removed on exit. It also caught and fixed the missing build output for `@biugle/biu-store/standard`. The recorded `pnpm verify` run passed: 346 tests, type checks and builds for all six Demos, package packing, 100 CLI create inputs, seven preset/environment builds, ESLint, Prettier, Knip, production dependency audit and `git diff --check`. Frozen-lockfile offline installation also passed.

### Browser and Development Resource Regression After Restart

- Stopped the old services, removed the project-level `.biu` snapshots for main-a, child-app and vue-child, and started one fresh service group. The CLI regenerated snapshots from the newly built foundation packages. Ports 9001, 8001 and 8002 returned HTTP 200 with exactly one listener each. Two old HMR missing-module errors from the build window did not recur after restart.
- `StandardTablePageShowcase`, `StandardTableTabsShowcase` and `EditableTablePageShowcase` were checked at 1280/700/390px. Action columns measured 190/160/60px, with ButtonList slots 5/3/1 including “More”; page-size and quick-jump controls measured 90/45/45px. Desktop filter fields were equal width, narrow filter layouts collapsed cleanly, and document scroll width matched the viewport.
- Table header, PageFilter, Detail and Form Tooltip icons had 0px DOM center-line delta from their labels. In `TableResizeShowcase`, dragging “最近更新” from 457px to 407px expanded the compensating “模块” column from 200px to 250px while the fixed action column stayed 190px; header and first-row cell edges matched with no trailing gap. The row-height demo changed its first row from 48px to 64px while the second remained 48px.
- About 2m44s after restart, Node RSS on ports 9001/8001/8002 was approximately 352/286/284MiB, idle CPU was 0%, and macOS reported 61% system memory available with no throttling. At about 22 minutes, RSS had fallen to and remained near 77/64/64MiB (about 204MiB total), CPU stayed at 0%, and system available memory was about 52% with no memory throttling. This shows no duplicate listeners or sustained growth during the short observation, but cannot rule out a longer-lived application leak. Some older browser tabs remain crash pages; a fresh acceptance tab now loads normally, while the old renderer cause remains unknown.

### Stable versions of all 18 public packages

| Package                     | Candidate stable version |
| --------------------------- | -----------------------: |
| `@biugle/biu-adapter-react` |                  `1.0.0` |
| `@biugle/biu-bridge`        |                  `1.0.0` |
| `@biugle/biu-cli`           |                  `1.0.2` |
| `@biugle/biu-events`        |                  `1.0.0` |
| `@biugle/http`              |                  `1.0.0` |
| `@biugle/biu-i18n`          |                  `1.0.0` |
| `@biugle/icons`             |                  `1.0.0` |
| `@biugle/logger`            |                  `1.0.0` |
| `@biugle/biu-preset`        |                  `1.0.3` |
| `@biugle/react-components`  |                  `1.0.1` |
| `@biugle/react-form`        |                  `1.0.1` |
| `@biugle/react-table`       |                  `1.0.1` |
| `@biugle/render-code`       |                  `1.0.0` |
| `@biugle/biu-router`        |                  `1.0.0` |
| `@biugle/biu-runtime`       |                  `1.0.3` |
| `@biugle/biu-store`         |                  `1.0.1` |
| `@biugle/tanstack-query`    |                  `1.0.0` |
| `@biugle/watermark`         |                  `1.0.0` |

All candidate versions use stable SemVer without beta, alpha, rc or other prerelease suffixes. The Changeset source was consumed by `changeset version`; because the package/changelog version diff is still uncommitted, `pnpm changeset status` exits with code 1 and reports no unconsumed Changeset. This is expected after generating stable version changes, not a prerelease setting. Do not add an empty or duplicate Changeset for this state. No extra Changeset was added that would bump the versions again. Version and changelog changes are not committed, and these candidate versions have not been published to npm.

### Final checklist and release decision

- [x] The root and CI share `pnpm verify`, covering package builds, type checks, tests, lint, formatting, Knip, dependency audit, CLI, packing and all Demo builds.
- [x] CLI creation covers 100 distinct inputs; seven preset/environment builds pass; foundation package lists are not duplicated.
- [x] All 18 public packages pack locally, declared manifest targets exist, and no workspace dependency or generated-file leakage was found.
- [x] A read-only npm registry check confirmed all 18 candidate versions are currently available.
- [x] Changesets generated stable versions and changelogs; no commit, push or npm publish was performed.
- [x] HTTP smoke tests for 9001, 8001 and 8002 returned 200 with one listener per port; after about 22 minutes the services used about 204MiB total RSS, with idle CPU, 52% system memory available and no memory throttling. This does not replace a long memory curve.
- [x] All three standard Table pages passed 1280/700/390px checks; Table/Filter/Detail/Form Tooltip alignment and real column/row resizing passed. A fresh acceptance tab loads normally; some old crashed tabs remain unexplained.
- [ ] Eleven foundation files still exceed 800 lines; they have not been split or recorded as reviewed exceptions. Counts are 2,658, 1,769, 1,233, 1,201, 1,118, 1,020, 1,006, 927, 888, 805 and 802 lines.
- [ ] No staged diff exists yet; inspect the staged contents for tokens, cookies, passwords, internal domains and local user data before the first commit.
- [ ] The real npm/GitHub Release workflow has not been run.

The oversized files are `packages/react-components/src/ui/control/index.tsx` (2,658), `packages/react-components/src/ui/navigation/index.tsx` (1,769), `packages/preset/src/layout-frame.tsx` (1,233), `packages/runtime/src/index.tsx` (1,201), `packages/react-components/src/ui/overlay/index.tsx` (1,118), `packages/cli/src/project.ts` (1,020), `packages/preset/src/layout-components.tsx` (1,006), `packages/react-components/src/ui/scroll/index.tsx` (927), `packages/react-table/src/ui/table.tsx` (888), `packages/react-components/src/ui/file/index.tsx` (805) and `packages/react-table/src/ui/use-table-resize.ts` (802).

**Decision: automated and current browser regression gates pass, so the candidate is ready for code review, but it is not ready for a formal release commit or publish.** Resolve the 11 oversized files and inspect the staged diff before the first commit. The branch has one local commit ahead of `github/main`, with additional uncommitted changes; nothing was staged, committed, pushed or published in this run.
