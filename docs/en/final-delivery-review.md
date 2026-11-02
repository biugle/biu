# Biu Final Delivery Review

Updated: 2026-11-02. This document records release audits, evidence, optimization priorities and external integration work. Architecture, component/API and Demo contracts live in [Foundation capabilities](biu-foundation-components-capabilities.md); guides are indexed in [Documentation](../README.en.md).

## Current conclusion and evidence boundary

This pass preserves functional design, routes and public APIs while fixing hidden failures, separating module responsibilities and improving bilingual documentation. The latest complete `pnpm verify` passed 496 tests and every delivery gate. All six running modes were restarted; focused browser regression and final checks after rebuilding passed.

Production old-hash caching, real SSO/CSP/monitoring and a 30-minute browser heap soak still need target-environment evidence. Public GitHub API checks on 2026-10-30 confirmed `main.protected=false` and private vulnerability reporting `enabled=false`. Administrators must address these settings and define supported security-maintenance versions before this release.

## Cleanup, fixes and module improvements

| Scope                 | Completed work                                                                                                                                                                     | Preserved boundary                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Core/orchestration    | Preset consumes I18n/Router/Store public entries directly; shared File/Preview types; package/Demo/source cycle checks                                                             | Reusable core packages, Runtime compatibility exports and public types remain                  |
| Auth/preferences      | One auth authority; legacy preference auth projection/writes; missing cache retains configuration; only four preferences persist                                                   | Login/logout/update stay synchronized; identity and credentials never enter preference storage |
| Locale                | Business localeUrl overlays built-ins; same-language async refresh updates memoized text; built-in Home, menus/API/examples translated and Form controls receive a Provider locale | Chinese source keys and public addLocale replacement semantics remain                          |
| HTTP/Query/Table      | Circular serialization, malformed list/total normalization, binary body identity                                                                                                   | Valid data, public serialization markers and normal requests remain compatible                 |
| Router/Runtime/Events | Timeout includes JSON body; single concurrent update notice and baseline races; stale unsubscribe/error isolation                                                                  | Navigation, update notification and event APIs remain                                          |
| CLI                   | Installed-package snapshots, embedded template versions, Query React peer, JSON dev manifests, missing options, filters and child shutdown                                         | create/init/start/build, seven presets and five environments remain                            |
| Pages/tests           | Four large Demo pages and four test files split by ownership with shared fixtures; every API/scenario retained; seven Form layout APIs now visible                                 | Single routes, interactions and scenario order remain                                          |
| CSS                   | Five oversized files split by ownership; 123 superseded declarations and 13 important overrides removed; ordered single Table CSS bundle                                           | Themes, geometry, customization and prescribed Preset filenames remain                         |
| Docs/README           | Six duplicate stage documents removed; one comprehensive specification/review, bilingual graphs and five redacted photos replacing eight old images                                | Public API manuals and useful historical incident evidence remain                              |
| Actions/scripts       | CI/CodeQL/Release/manual Demo retained; duplicate push build removed; CI prepare avoids rebuilding; old symlink fixture/baseline removed                                           | Dependency scripts, local prepare and release/delivery gates remain                            |

No whole script was found removable without losing an active caller. Dead branches and redundant records were removed. Every JS/JSX/MJS/TS/TSX/CSS file has an 800-line limit without exceptions. Locale JSON and lockfiles are data; their complete structures remain. Additional translation resources fill missing visible text, and additional source files reflect separate responsibilities.

Browser follow-up: Demo localization previously copied Dayjs range instances into plain records, crashing DatePicker. Instances now retain prototypes/identity and two regressions cover the boundary. Shared LayoutFrame keeps an icon-only expand control at the top edge of the collapsed 60px rail and menu settings in the footer in every state; fully hidden navigation restores through the same top control outside the navigation. Expansion/hiding/recovery and public controlled layout parameters remain. Notification content, actual mock values and English long-title boundary examples are documented data/display exceptions.

This release review additionally fixed locale changes resetting update baselines and retired requests displaying notices after unmount, disable or manifest URL replacement. ArrayBuffer, DataView and TypedArray uploads use client-scoped object identity without canceling distinct instances or traversing large buffers; identical instances still deduplicate and public serialization stays compatible. Release uses `queue: max` to retain up to 100 pending runs so later ordinary pushes cannot replace queued Release PR merge runs. Actual publication on the target GitHub Actions platform still needs operational acceptance.

## Additional fixes from this repository scan

The October 30 scan started from a clean committed baseline, preserving functional design and public APIs without changing CSS. It fixed these verified boundaries:

- Explicit empty or invalid Bridge target origins no longer fall back to an unchecked parent; overlays do not notify an unresolved host.
- Inbound host APP_EVENT messages publish locally without echoing back; local application events still forward normally.
- iframe HOST_CONTEXT tracks the authoritative Auth Store. Login, refresh and logout send current redacted identity without recreating the iframe.
- createBiuStore retains Zustand's stable initial snapshot including actions for SSR/hydration; the reset factory keeps its existing semantics.
- Demo children are localized once, eliminating React key warnings, preserving nested code/pre text and reducing duplicate translation work. Independent fire roots, standard pages, controls and dynamic callbacks receive the current locale. The type filter is correctly labeled Owner type. Table resizing, filtering and ordering labels now separate English words while preserving Chinese labels and localeText overrides.

All 18 public packages now include repository/directory, homepage and bugs metadata, checked in actual tarballs. The single Changeset covers patch releases for all 18 packages and retains the requested summary “性能与整体收缩，文档优化。”; no versioning or publication was performed. The review covered 92 Markdown files, local links, anchors, grammar, internal reference names and bilingual contracts. Ten documentation examples and 37 HTTP field examples passed TypeScript checks.

API data now matches implementation: the nonexistent XHttpClass.config row was removed; HTTP cancellation, DELETE bodies, header replacement, I18n chaining/resource registration and Query defaults/callbacks were corrected. Table data fixes 56 type fields and assigns sizing, EditableCellConfig, ButtonListItem and query context to their actual owners. Executed ComponentUI/Form/Table exports produce 1258 display rows and 1092 distinct component/property pairs, with no missing translatable text. Static object extraction adds coverage; these counts do not constitute a complete automated snapshot of every package API.

main-a has 3411 entries in each language. English grew from 2742 entries in this pass's baseline to 3411, a net increase of 669; 144 missing Chinese keys were filled. child-app PageB is localized. Intentional missing-key cases, runnable code, actual mock data and documented long-title boundary cases retain their source content. Existing Demo tests enforce unique keys, language parity, English values and interpolation. Obsolete descriptions and temporary audit files were removed.

## Pull/rebase integration review on 2026-11-02

Local commit `691b1b93137fe3444b3234600c88135066cd2945` is replayed onto upstream release commit `842274816d18a2d9b60fead5c72c54f71ea0dcdc`. Blob comparisons preserve all 708 local source and test files; all 18 public packages retain upstream versions and package dependencies, and all 13 upstream changelogs remain. Upstream consumed the old 12-package Changeset. A fresh `.changeset/performance-and-docs-followup.md` carries the local fixes and metadata: patches for 18 packages, retaining “性能与整体收缩，文档优化。”. Published versions are not rolled back and npm publish is not executed.

The first complete check passed 496 tests, but the production audit reported [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p): pinned `follow-redirects 1.16.1` is affected. The root workspace override and lockfile now use patched `1.16.2`; the Axios version and business APIs remain unchanged. This root configuration constrains this repository and does not automatically constrain npm consumers. Downstream projects locking `1.16.0` / `1.16.1` must update their own lockfiles or overrides and rerun audits.

After the fix, the complete `pnpm verify` ran again at **2026-11-02 09:48:16–2026-11-02 09:50:38 (UTC+8)**: exit 0, 496/496 passed, zero failures/cancellations/skips, and no known production dependency vulnerabilities. All 18 actual tarballs, two installed CLI consumers, 100 creation inputs, seven presets/five environments, six Demo builds and other delivery gates passed. Only this bilingual review changed afterward; the staged diff was checked for credentials, private data, conflict markers and generated files before committing.

After stopping services, 12 Demo generated directories were removed and all six acceptance endpoints restarted. HTML and manifests return 200 with correct JSON MIME, appId and local environment. Temporary gate logs and result files are removed after archival; ignored snapshots needed for running services remain. The October 30 browser evidence, score and version table remain dated historical evidence; this section adds no production-environment or long-running heap acceptance claim.

## Independent follow-up review record

Reviewed on 2026-10-30 (Asia/Shanghai). The acceptance baseline is HEAD `b4907166c375f0406329bd48dba7531b883cf0f1` plus the current uncommitted changes, not a published version. This review found and fixed two previously missed boundaries:

- Cleared authentication revived stale identity: configuration initializes identity once, after which the Shell and iframe use only Auth Store. `clear()` / `setAuth(undefined)` retain an empty identity, the required auth gate appears, stale HOST_CONTEXT does not override later identity and the iframe is not recreated.
- ReactNode headers: filters, resizing, column settings and CSV headings read nested text and fall back to the column key for empty, icon-only or unreadable titles. Custom components are not executed; visible headers, CSV cell values and quoting remain. The existing resize example now wraps the same label in a span; API data, both locale resources, README and the capability specification were synchronized.

Seven regressions were added (Runtime: two, Table: five). This complete gate actually ran at **2026-10-30 20:35:17–2026-10-30 20:37:36 (UTC+8)**; see the results below, separately from the earlier 489-test record. The SHA-256 fingerprint of source, scripts, Demos, manifests and workflow differences from that HEAD, including new tests, is `d15fc1eddc7a7e1f02c5e63685bf7baff6754f8972c40c97b98f31db14595c8b`. Only delivery records and a local acceptance screenshot changed afterward.

Public GitHub API checks again returned 200: public repository, default branch main, `main.protected=false`, private vulnerability reporting `enabled=false`. No Secret values were read or platform settings changed. The 11 open TODO items now include required stages, suggested owner roles and completion evidence. The score remains 90/100.

## Final validation

The earlier release review passed 477 tests, and the earlier repository scan added 12 regressions and passed the complete `pnpm verify` with 489 tests. Its intermediate formatting failure was corrected and retained as historical evidence. This independent review added seven regressions; the final complete `pnpm verify` finished with **exit 0**, **496 passing tests, zero failures, zero cancellations and zero skips**. It covered package/Demo typechecks, 18 real tarballs and metadata/exports, two external CLI consumers, 100 creation inputs, seven presets and five environments, six production Demo builds and size budgets, ESLint/Prettier/Knip, production dependency audit and diff checks. Only bilingual delivery evidence and a local acceptance screenshot changed afterward; formatting, local links, artifacts and diff checks were then rerun.

| Final checklist                                                    | Result                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public-package and six-Demo typechecks                             | PASS                                                                                                                                                                                                          |
| 18 public-package tarballs, exports and pollution checks           | PASS                                                                                                                                                                                                          |
| Two external installed CLI consumers, real dev / prod build        | PASS                                                                                                                                                                                                          |
| Package, CLI, release-origin, boundary and Demo regressions        | 496 / 496 PASS                                                                                                                                                                                                |
| 100 CLI creation inputs, seven presets, five-environment scenarios | PASS                                                                                                                                                                                                          |
| ESLint, Prettier, Knip, git diff --check                           | PASS                                                                                                                                                                                                          |
| Production dependency audit                                        | No known vulnerabilities                                                                                                                                                                                      |
| 18 packages, six Demos, 467 sources: boundaries and cycles         | PASS                                                                                                                                                                                                          |
| 800-line budget across 708 code/CSS files                          | Zero oversized files or exceptions                                                                                                                                                                            |
| Six production Demo builds and gzip budgets                        | PASS                                                                                                                                                                                                          |
| Final cleanup/restart                                              | This review first stopped services and removed six stale snapshots; after the complete gate, 12 Demo generated directories were cleaned and six services restarted; no empty source directories or stray logs |
| Changeset                                                          | One patch Changeset covering 18 packages; summary “性能与整体收缩，文档优化。”                                                                                                                                |

Previous browser evidence for the version with 477 passing tests:

| Mode/page                               | Result                                                                                                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar Portal / standard Table         | 110 records, 20 per page; query returns 19 and reset restores 110; column hide/show works; width 180→212→reset180px; no outer desktop overflow                                         |
| Narrow standard Table                   | Fresh innerWidth/pageWidth measurements both equal 390px; advanced Drawer and inline fields share state, action column is 60px, no outer overflow                                      |
| Topbar Portal                           | Two nested levels remain readable, directory button width 208px, full Overview URL works                                                                                               |
| React / Vue / HTML APP                  | Shared LayoutFrame keeps the collapse/expand control at the top edge and menu settings in the footer in expanded and collapsed states; hidden navigation restores from the top control |
| Vue / HTML locale                       | Content, menus and browser titles switch to English; Vue counter advances 0 to 1; explicit HTML project Adapter is used                                                                |
| ComponentUI / Form / Table capabilities | Fresh English API/example refresh, September 20 selection and Escape close pass; Form required validation and aria-invalid pass; no console errors/warnings                            |
| React Custom                            | fire.render body content and Dialog mount/close correctly; browser console has no errors/warnings                                                                                      |
| Six-service health                      | HTML and /manifest/routes.json return 200 with JSON MIME, correct appId and local environment                                                                                          |

Browser regression from the earlier repository scan (489-test version, retained as historical evidence):

| Scope              | Observed result                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standard Table     | 110 rows → query: 19 → reset: 110; column hide/show; width 180 → 212 → reset to 180px; Add/Cancel Drawer works                                      |
| 390px viewport     | innerWidth/pageWidth=390px; action column 60px; advanced Drawer and inline fields share state; viewport restored to 1280px                          |
| English text       | Seven core service pages, PageB, Vue/HTML and Custom checked; batch input and independent Drawer buttons use English; Owner type matches the field  |
| Running modes      | Topbar Overview works; React collapsed rail is approximately 60px; Vue counter 0 → 1; HTML English title/content; Custom body/Modal mount and close |
| Final snapshots    | Fresh browser verifies Platform Dialog and standard Table; English labels have word spacing; zero console errors/warnings; Chinese restored         |
| Six-service health | HTML and manifest/routes.json return 200; JSON MIME, appId and local environment match                                                              |

Actual checks after this restart: all six HTML and `/manifest/routes.json` endpoints returned 200 with matching JSON MIME, appId and local environment. The standard page restored Chinese, 110 records and 20 per page, with both viewport and page width at 1280px. The real ReactNode resize example retained its “能力名称” header and correct resize label, with no `[object Object]` labels or console errors/warnings. Before rebuilding, this review also passed 110→query:19→reset:110 and Chinese/English Add/Cancel overlays. Not all historical manual scenarios were repeated; long-running heap and target-production acceptance remain open. The 92 Markdown documents and 173 local links/anchors were rechecked without errors.

The five README photos contain sanitized Demo data only. The previous pass removed 36 temporary audit entries and a separate CSS backup directory; the earlier three gate logs and temporary SSR/audit probes were cleaned; this review removes its gate log and temporary result file after archival. Current ignored `.biu/`, public-package `dist/` and dependencies remain for running services; snapshots are never deleted while services run. Generated `.husky/_/` is absent and the source pre-commit hook remains. No commit, push or release was performed; staged diff inspection remains required before committing.

Acceptance: [Portal A / standard Table](http://localhost:9001/TableCapabilities/StandardTablePageShowcase), [Portal B](http://localhost:9002/SystemConfig/BasicSettings/Overview), [React APP](http://localhost:8001/PageA), [Vue APP](http://localhost:8002/VuePage), [HTML APP](http://localhost:8003/Welcome), [Custom](http://localhost:8007/).

The gate includes 18 real tarballs, two external CLI consumers, 100 creation inputs, seven presets/five environments, six Demo builds, package/Demo typechecks, all regressions, ESLint, Prettier, Knip, production dependency audit, module boundaries, 800-line code/CSS and gzip budgets, and `git diff --check`. Production-platform and long-running memory checks are not counted as passed.

The build still reports a non-blocking outdated caniuse-lite database notice. Database/lockfile updates should recheck target browsers and size budgets.

## CLI acceptance coverage

| Boundary                      | Evidence                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Help/language                 | Bilingual help and diagnostic regressions passed                                                    |
| init/create                   | Real multi-project terminal init; 100 inputs and seven preset builds passed                         |
| Generated-project quality     | 14 template-format cases; two installed consumers passed typecheck/lint/format                      |
| Independent install/snapshots | Current tarballs resolve inside consumers without repository-relative paths; actual dev/prod passed |
| Build/menu filtering          | Valid/empty/fallback menu and environment regressions passed; --all remains diagnostic              |
| Options/filter                | Missing explicit values, inline filter forwarding and actual workspace startup passed               |
| --apps lifecycle              | Portal/React/Vue start independently with matching appIds/ports; SIGTERM released all ports         |

## Manifest snapshot from 2026-10-30 (historical)

These are the actual stable versions in repository `packages/*/package.json` on 2026-10-30. This table is not an npm-registry lookup and does not imply this pass published anything. Changesets controls versioning and publishing.

| Public package              | Manifest version |
| --------------------------- | ---------------- |
| `@biugle/biu-adapter-react` | `2.0.0`          |
| `@biugle/biu-bridge`        | `1.0.1`          |
| `@biugle/biu-cli`           | `1.1.0`          |
| `@biugle/biu-events`        | `1.0.0`          |
| `@biugle/http`              | `1.0.1`          |
| `@biugle/biu-i18n`          | `1.0.1`          |
| `@biugle/icons`             | `2.0.0`          |
| `@biugle/logger`            | `1.0.0`          |
| `@biugle/biu-preset`        | `2.0.0`          |
| `@biugle/react-components`  | `2.0.0`          |
| `@biugle/react-form`        | `2.0.0`          |
| `@biugle/react-table`       | `2.0.0`          |
| `@biugle/render-code`       | `1.0.0`          |
| `@biugle/biu-router`        | `1.0.1`          |
| `@biugle/biu-runtime`       | `2.0.0`          |
| `@biugle/biu-store`         | `1.0.2`          |
| `@biugle/tanstack-query`    | `2.0.0`          |
| `@biugle/watermark`         | `1.0.0`          |

Eight React-related public packages currently use the React 19 peer contract. The host supplies matching React/React DOM; a separate component-library copy must not enter the published bundle. See the [package graph](package-graph.md) for consumer and dependency boundaries.

## Historical incidents retained as evidence

### A normal main push once published packages directly

On 2026-10-23, `Docs: NEW VERSION FIRST` (commit `3e7e40d`) became the new `main` HEAD through a direct push; the commit-to-PR API returned no associated PR. Release [run 39960428226](https://github.com/biugle/biu/actions/runs/39960428226) succeeded in the same window and 18 v1 package versions were published. The old workflow listened to every main push and the publish entry did not verify Release PR origin. Merged Changesets [PR #6](https://github.com/biugle/biu/pull/6) is the reference for the expected PR flow.

The repository now verifies Release PR origin: ordinary pushes safely skip npm publishing and unverifiable origins fail closed. This code guard does not replace required GitHub checks. Public GitHub API checks on 2026-10-30 again confirmed `main.protected=false`; administrator rules remain disabled.

### An old-hash script received cacheable HTML from SPA fallback

The 2026-10-25 production HEAD record for `https://biu-a.biugle.cn/b46ebfbd.js` returned `200 text/html`, `Content-Disposition: index.html` and `Cache-Control: public, max-age=14400` (four hours). Its source map returned 403 and the then-current home page did not reference that hash.

This supports a version mismatch where an old page requests a retired lazy chunk and receives HTML fallback. It does not establish the specific cause of the `.reduce` exception. Repository [vercel.json](../../vercel.json) now returns 404/no-store for missing extension-bearing assets and no-cache for the entry. Runtime has one cooldown-limited recovery for identifiable chunk failures plus manual refresh. No production deployment/cache retest was performed during this pass, so the production issue remains open.

### Locale request loop and memory observations

On 2026-10-23, using `localeUrl` without `locales` recreated default locale lists during rendering. Successful requests changed revision state and retriggered the effect. About 250 requests for the same locale resource were observed in roughly 19 seconds. Browser Task Manager reported approximately 133% CPU and 13.1GB memory, while JS heap was about 131MB.

Stable locale/option references and a real-mount regression now cover this loop, asserting one request after state updates. Task Manager memory is not JS heap; historical server RSS or short idle samples cannot establish a stable long-running browser heap. Other OOM incidents cannot all be attributed to this fault. A 30-minute real-browser soak remains follow-up work.

## Engineering and integration readiness score

| Dimension                                   |      Score | Basis and limit                                                                                                                                            |
| ------------------------------------------- | ---------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture and package boundaries         |      24/25 | Reusable core/orchestration layers and source DAG checks exist; target-platform evidence remains incomplete                                                |
| Public API and consumer experience          |      19/20 | React 19 and API documentation are consistent; actual tarball consumers passed; declaration snapshots and migration exercises remain                       |
| Automated regression and CI                 |      19/20 | Complete local gates and focused regressions exist; browser/accessibility checks are not yet required CI                                                   |
| Security and production readiness           |      13/20 | Chunk recovery and routing/cache defenses exist; branch protection is confirmed disabled; real SSO/CSP/monitoring still need target-environment acceptance |
| Repository maintenance and release defenses |      15/15 | Changesets/origin guards, zero size exceptions, ownership splits, deduplicated docs and CI builds                                                          |
| **Total**                                   | **90/100** | **Engineering assessment based on regression evidence; external production requirements remain open**                                                      |

## GitHub Secrets and two separate deployment paths

| Configuration             | Purpose                                                                            | Acceptance requirement                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `NPM_GIT_BIUGLE`          | npm granular token with `@biugle` publish permission                               | Administrator confirms Repository Secret and validates publishing; never place it in source or Vercel               |
| `CHANGESETS_GITHUB_TOKEN` | Least-privilege GitHub token allowing generated Release PRs to trigger required CI | Configure when Release PRs require CI and verify those checks actually appear; do not reuse the npm token           |
| `GITHUB_TOKEN`            | Automatically supplied workflow token                                              | Do not create a same-name Secret manually; PRs created with this token do not automatically trigger other workflows |

npm path: feature PR/Changeset → dev integration → reviewed dev → main promotion → complete main gate → Version PR → reviewed Release PR merge → origin validation → publish affected packages only. Validation checks the merged same-repository `changeset-release/main` PR, base branch, fixed title and associated commit; API failures fail closed.

Vercel path: each Portal/APP Project builds and deploys independently through native Git integration, with dev for Preview and main for Production. Manual `deploy-demo.yml` uploads acceptance artifacts without calling Vercel CLI. A deployment owner must verify the six Projects' domains, branch and build settings. See [Release](release.md) and [Vercel deployment](vercel-deploy.md).

## Optimization priorities and outstanding work

All items below remain open. Before public release, complete R1, R2 and the release-configuration part of R3; finish R3 registry verification after publishing. D1–D2 apply to business production deployment. Owners are suggested roles, not assigned individuals.

| ID  | Priority | Required stage                               | Suggested owner                     | Work and completion evidence                                                                                                                                                                                                                                                                                              |
| --- | -------- | -------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | P0       | Before public package release                | Repository administrator            | main Ruleset requires PR/CI, blocks force pushes/deletion and limits bypass; a real Release PR receives and passes required checks.                                                                                                                                                                                       |
| R2  | P0       | Before public package release                | Administrator / security maintainer | Enable private reporting or publish a verified private channel; define supported versions, end-of-support and response policy per package major or an explicit latest-stable policy.                                                                                                                                      |
| R3  | P0       | Before release and post-release verification | Release maintainer                  | Verify npm/GitHub Secret permissions and expiry in the platform; the Release PR actually triggers CI and the publication run records origin validation; after release, install affected packages from the registry and record versions and consumer smoke results. Retain configuration status only, never Secret values. |
| D1  | P0       | Before business production launch            | Deployment owner                    | Valid JS MIME, missing JS/CSS/maps return 404/no-store, entry uses no-cache; at most one automatic recovery per page/resource in the same browser-tab session within the ten-minute cooldown, with manual refresh after repeated failure.                                                                                 |
| D2  | P0       | Before business production launch            | SSO / backend / frontend            | Record target-environment login/logout/refresh/revocation, fail-closed, exact Origin, frame-src/frame-ancestors, Cookie and deep-link regression evidence.                                                                                                                                                                |
| O1  | P1       | Initial launch and later drills              | Operations / frontend               | Redacted error/navigation/remote-load events reach monitoring; complete a paired Portal/APP rollback with matching versions, manifests and APP_URL.                                                                                                                                                                       |
| Q1  | P1       | Next quality iteration                       | QA / frontend                       | Browser E2E covers Portal A/B, three APP frameworks, Custom, narrow-screen Tables/overlays and keyboard use; add accessibility checks and promote stable tests to required CI.                                                                                                                                            |
| Q2  | P1       | Next quality iteration                       | QA / frontend                       | On the same version/browser, run continuous interactions for 30 minutes and record heap/DOM/listener baseline, peak and multiple post-cleanup samples; return to a stable range without increasing retained quantities each round or a same-locale request loop.                                                          |
| C1  | P2       | Compatibility iteration                      | Package maintainers                 | Preserve actual-tarball consumer commands covering a single React instance, ESM/CSS, CLI create/start/build, legacy config and migration from published v1 to current packages and React 19 peers.                                                                                                                        |
| C2  | P2       | Maintenance iteration                        | Package / CI maintainers            | Automatically check public declaration changes; review SHA-pinned official Actions and validate compatibility before upgrading.                                                                                                                                                                                           |
| C3  | P2       | Maintenance iteration                        | Frontend maintainers                | Update caniuse-lite/lockfile, verify target browsers and retain gzip budgets.                                                                                                                                                                                                                                             |

Completed items removed from TODO: eight code-size exceptions, five oversized stylesheets, 13 important overrides, missing child-app/main-b translations, duplicate CI prepare builds and the external CLI installation fixture gap. The score is an engineering assessment of architecture, regressions, production integration and maintenance evidence, not a third-party certification.

Formal npm/Vercel publishing and production control changes follow the controlled process after Secrets and platform rules are configured. This pass handles repository cleanup, debugging and documentation. The CLI install gate follows its own process's reported port and verifies appId to avoid false failures after a port fallback; Query core retains optional React boundaries.
