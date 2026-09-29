# Implementation Matrix

| Area                       | Implementation                               | Verification                                                                                                            | Status |
| -------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| Project generation         | `@biugle/biu-cli`                            | create/init tests and 100 scenarios                                                                                     | PASS   |
| Portal/APP separation      | CLI and Runtime                              | independent root builds, `src/pages/index.*` fallback and remote APP loading                                            | PASS   |
| Complete menu URL          | `@biugle/biu-router` and Runtime             | duplicate Code and deep-link tests                                                                                      | PASS   |
| Official Layouts           | `@biugle/biu-preset`                         | preset builds and Portal A/B browser checks                                                                             | PASS   |
| React Custom               | `layout-custom` and Runtime                  | independent Custom build                                                                                                | PASS   |
| React/HTML/Vue integration | Adapter Contract                             | React, HTML and Vue APP builds                                                                                          | PASS   |
| Zustand stores             | `@biugle/biu-store`                          | scoped menu, Tabs and preference tests                                                                                  | PASS   |
| i18n reload                | `@biugle/biu-i18n` and Runtime               | locale-aware menu request tests                                                                                         | PASS   |
| Bridge security            | `@biugle/biu-bridge`                         | Origin and sensitive-field tests                                                                                        | PASS   |
| UI foundation              | `@biugle/react-components`                   | UI/Pro order, complete catalog, 52 component tests and representative browser regression                                | PASS   |
| Forms and query tables     | `@biugle/react-form`, `@biugle/react-table`  | Form.Item, FormGroup, common controls, Table composition, 7/18 package tests and browser regression                     | PASS   |
| HTTP transport             | `@biugle/http`                               | 30 compatibility tests cover methods, hooks, cancel, retry, duplicate requests and uploads against ts-xhttp baseline    | PASS   |
| Files, UI/Pro and icons    | `@biugle/react-components`, `@biugle/icons`  | full ordered catalog, file preview, icon search/categories and browser evidence                                         | PASS   |
| Query standard             | `@biugle/tanstack-query` (`/core`, `/react`) | framework-neutral core, React hooks, cancel/pagination/mutation/invalidate and API Demo                                 | PASS   |
| Render code                | `@biugle/render-code`                        | QR canvas/data URL, JsBarcode SVG, img fallback, export, API Demo and 3 tests                                           | PASS   |
| Watermark                  | `@biugle/watermark`, `@biugle/biu-preset`    | update/destroy, tamper observation, style options, Layout integration, logger link and API Demo                         | PASS   |
| Logger                     | `@biugle/logger`                             | colored logs, console guard, best-effort detection, debugger lifecycle, throttled callback, watermark link and API Demo | PASS   |
| CLI quality                | ESLint, Prettier, Knip, Husky                | CI and local gates; 174 tests and 100 CLI scenarios                                                                     | PASS   |
| Release                    | Changesets and GitHub Actions                | version/publish workflow                                                                                                | PASS   |

Production gateway headers, SSO, monitoring SDK and business APIs remain deployment/project responsibilities.
