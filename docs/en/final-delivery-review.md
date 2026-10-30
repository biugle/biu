# Biu Final Delivery Review

Updated: 2026-10-30. This document records release audits, evidence, optimization priorities and external integration work. Architecture, component/API and Demo contracts live in [Foundation capabilities](biu-foundation-components-capabilities.md); guides are indexed in [Documentation](../README.en.md).

## Current conclusion and evidence boundary

This pass preserves functional design, routes and public APIs while fixing hidden failures, separating module responsibilities and improving bilingual documentation. The final complete `pnpm verify` passed 477 tests and every delivery gate. All six running modes were restarted and browser acceptance completed.

Production old-hash caching, GitHub branch protection, real SSO/CSP/monitoring and a 30-minute browser heap soak still need target-environment evidence.

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

Browser follow-up: Demo localization previously copied Dayjs range instances into plain records, crashing DatePicker. Instances now retain prototypes/identity and two regressions cover the boundary. Shared LayoutFrame uses one footer restore action in the collapsed 60px rail and keeps top recovery outside fully hidden navigation. Expansion/hiding/recovery and public controlled layout parameters remain. Notification content, actual mock values and English long-title boundary examples are documented data/display exceptions.

This release review additionally fixed locale changes resetting update baselines and retired requests displaying notices after unmount, disable or manifest URL replacement. ArrayBuffer, DataView and TypedArray uploads use client-scoped object identity without canceling distinct instances or traversing large buffers; identical instances still deduplicate and public serialization stays compatible. Release uses `queue: max` to retain up to 100 pending runs so later ordinary pushes cannot replace queued Release PR merge runs. Actual publication on the target GitHub Actions platform still needs operational acceptance.

## Final validation

The 2026-10-30 release regression first passed 472 tests. Further review found update-checker locale/retired-response and ArrayBuffer upload-identity failures. Five added regressions failed on the old implementation and passed after the fixes; the Release queue was also corrected to retain pending publication runs. The final source then ran the complete `pnpm verify` again: **exit 0**, **477 passing tests and zero failures**, including typechecks, real tarball consumers, creation/environment scenarios, all six Demo builds and size budgets, static checks and production dependency audit. Only review evidence and the acceptance screenshot changed afterward; formatting, documentation links, pollution and diff checks were rerun.

| Final checklist                                                    | Result                                                                                                                                                                                  |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public-package and six-Demo typechecks                             | PASS                                                                                                                                                                                    |
| 18 public-package tarballs, exports and pollution checks           | PASS                                                                                                                                                                                    |
| Two external installed CLI consumers, real dev / prod build        | PASS                                                                                                                                                                                    |
| Package, CLI, release-origin, boundary and Demo regressions        | 477 / 477 PASS                                                                                                                                                                          |
| 100 CLI creation inputs, seven presets, five-environment scenarios | PASS                                                                                                                                                                                    |
| ESLint, Prettier, Knip, git diff --check                           | PASS                                                                                                                                                                                    |
| Production dependency audit                                        | No known vulnerabilities                                                                                                                                                                |
| 18 packages, six Demos, 467 sources: boundaries and cycles         | PASS                                                                                                                                                                                    |
| 800-line budget across 704 code/CSS files                          | Zero oversized files or exceptions                                                                                                                                                      |
| Six production Demo builds and gzip budgets                        | PASS                                                                                                                                                                                    |
| Final cleanup/restart                                              | Previous pass removed 30 generated directories; this pass stopped services, removed 12 Demo generated directories and restarted six services; no empty source directories or stray logs |
| Changeset                                                          | One patch Changeset; summary “性能与整体收缩，文档优化。”                                                                                                                               |

Actual browser acceptance:

| Mode/page                               | Result                                                                                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar Portal / standard Table         | 110 records, 20 per page; query returns 19 and reset restores 110; column hide/show works; width 180→212→reset180px; no outer desktop overflow              |
| Narrow standard Table                   | Fresh innerWidth/pageWidth measurements both equal 390px; advanced Drawer and inline fields share state, action column is 60px, no outer overflow           |
| Topbar Portal                           | Two nested levels remain readable, directory button width 208px, full Overview URL works                                                                    |
| React / Vue / HTML APP                  | Shared LayoutFrame collapses to a 60px rail with one footer restore button; fully hidden React navigation recovers from its top control                     |
| Vue / HTML locale                       | Content, menus and browser titles switch to English; Vue counter advances 0 to 1; explicit HTML project Adapter is used                                     |
| ComponentUI / Form / Table capabilities | Fresh English API/example refresh, September 20 selection and Escape close pass; Form required validation and aria-invalid pass; no console errors/warnings |
| React Custom                            | fire.render body content and Dialog mount/close correctly; browser console has no errors/warnings                                                           |
| Six-service health                      | HTML and /manifest/routes.json return 200 with JSON MIME, correct appId and local environment                                                               |

The five README photos contain sanitized Demo data only. The previous pass removed 36 temporary audit entries and a separate CSS backup directory; this pass cleans both regression logs after archival. Current ignored `.biu/`, public-package `dist/` and dependencies remain for running services; snapshots are never deleted while services run. Generated `.husky/_/` is absent and the source pre-commit hook remains. No commit, push or release was performed; staged diff inspection remains required before committing.

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

## Current manifest versions

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

The repository now verifies Release PR origin: ordinary pushes safely skip npm publishing and unverifiable origins fail closed. This code guard does not replace required GitHub checks. Previously archived remote checks reported `main.protected=false`; this pass does not claim an administrator has enabled those rules.

### An old-hash script received cacheable HTML from SPA fallback

The 2026-10-25 production HEAD record for `https://biu-a.biugle.cn/b46ebfbd.js` returned `200 text/html`, `Content-Disposition: index.html` and `Cache-Control: public, max-age=14400` (four hours). Its source map returned 403 and the then-current home page did not reference that hash.

This supports a version mismatch where an old page requests a retired lazy chunk and receives HTML fallback. It does not establish the specific cause of the `.reduce` exception. Repository [vercel.json](../../vercel.json) now returns 404/no-store for missing extension-bearing assets and no-cache for the entry. Runtime has one cooldown-limited recovery for identifiable chunk failures plus manual refresh. No production deployment/cache retest was performed during this pass, so the production issue remains open.

### Locale request loop and memory observations

On 2026-10-23, using `localeUrl` without `locales` recreated default locale lists during rendering. Successful requests changed revision state and retriggered the effect. About 250 requests for the same locale resource were observed in roughly 19 seconds. Browser Task Manager reported approximately 133% CPU and 13.1GB memory, while JS heap was about 131MB.

Stable locale/option references and a real-mount regression now cover this loop, asserting one request after state updates. Task Manager memory is not JS heap; historical server RSS or short idle samples cannot establish a stable long-running browser heap. Other OOM incidents cannot all be attributed to this fault. A 30-minute real-browser soak remains follow-up work.

## Engineering and integration readiness score

| Dimension                              |      Score | Basis and limit                                                                                                                      |
| -------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture and package boundaries    |      24/25 | Reusable core/orchestration layers and source DAG checks exist; target-platform evidence remains incomplete                          |
| Public API and consumer experience     |      19/20 | React 19 and API documentation are consistent; actual tarball consumers passed; declaration snapshots and migration exercises remain |
| Automated regression and CI            |      19/20 | Complete local gates and focused regressions exist; browser/accessibility checks are not yet required CI                             |
| Security and production readiness      |      13/20 | Chunk recovery and routing/cache defenses exist; branch protection and real SSO/CSP/monitoring lack fresh evidence                   |
| Maintainability and release governance |      15/15 | Changesets/origin guards, zero size exceptions, ownership splits, deduplicated docs and CI builds                                    |
| **Total**                              | **90/100** | **Engineering assessment based on regression evidence; external production requirements remain open**                                |

## GitHub Secrets and two separate deployment paths

| Configuration             | Purpose                                                                            | Acceptance requirement                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `NPM_GIT_BIUGLE`          | npm granular token with `@biugle` publish permission                               | Administrator confirms Repository Secret and validates publishing; never place it in source or Vercel               |
| `CHANGESETS_GITHUB_TOKEN` | Least-privilege GitHub token allowing generated Release PRs to trigger required CI | Configure when Release PRs require CI and verify those checks actually appear; do not reuse the npm token           |
| `GITHUB_TOKEN`            | Automatically supplied workflow token                                              | Do not create a same-name Secret manually; PRs created with this token do not automatically trigger other workflows |

npm path: feature PR/Changeset → complete main gate → Version PR → reviewed Release PR merge → origin validation → publish affected packages only. Validation checks the merged same-repository `changeset-release/<branch>` PR, base branch, fixed title and associated commit; API failures fail closed.

Vercel path: each Portal/APP Project builds and deploys independently through native Git integration. The npm guard does not block Vercel main deployments; manual `deploy-demo.yml` uploads acceptance artifacts without calling Vercel CLI. A deployment owner must verify the six Projects' domains, Production Branch and build settings. See [Release](release.md) and [Vercel deployment](vercel-deploy.md).

## Optimization priorities and outstanding work

| Priority | Work                                                   | Completion evidence                                                                                                                            |
| -------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | GitHub main Ruleset and Release PR required checks     | PR/CI required, force pushes/deletion blocked, bypass limited; actual Release PR receives required checks                                      |
| P0       | Production old-hash routing/cache                      | Valid JS MIME; missing JS/CSS/maps return 404/no-store; entry is not cached; old-page recovery occurs only once                                |
| P0       | Real SSO, permissions, Origin, CSP and Cookie settings | Target-environment login/logout/refresh/revocation, fail-closed, exact Origin, frame-src/frame-ancestors and deep-link evidence                |
| P1       | Monitoring and paired Portal/APP rollback              | Redacted error/navigation/remote-load events reach monitoring; rollout/rollback versions, manifests and APP_URL match                          |
| P1       | Real-browser E2E and accessibility CI                  | Portal A/B, three APP frameworks, Custom, narrow-screen Tables/overlays and keyboard coverage; stable checks become required                   |
| P1       | 30-minute browser heap soak                            | Continuous navigation, filtering, resizing, locale changes and iframe mount/unmount; heap/node/listener baseline, peak and post-release trends |
| P2       | External consumer and migration fixtures               | Install actual tarballs; cover one React host, ESM, CSS, CLI create/start/build and legacy configuration                                       |
| P2       | Browser compatibility database and dependencies        | Update caniuse-lite/lockfile, verify target browsers and retain gzip budgets                                                                   |

Completed items removed from TODO: eight code-size exceptions, five oversized stylesheets, 13 important overrides, missing child-app/main-b translations, duplicate CI prepare builds and the external CLI installation fixture gap. The score is an engineering assessment of architecture, regressions, production integration and maintenance evidence, not a third-party certification.

Formal npm/Vercel publishing and production control changes follow the controlled process after Secrets and platform rules are configured. This pass handles repository cleanup, debugging and documentation. The CLI install gate follows its own process's reported port and verifies appId to avoid false failures after a port fallback; Query core retains optional React boundaries.
