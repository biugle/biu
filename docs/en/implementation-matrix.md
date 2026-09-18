# Implementation Matrix

| Area                       | Implementation                   | Verification                                                                 | Status |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------------------- | ------ |
| Project generation         | `@biugle/biu-cli`                | create/init tests and 100 scenarios                                          | PASS   |
| Portal/APP separation      | CLI and Runtime                  | independent root builds, `src/pages/index.*` fallback and remote APP loading | PASS   |
| Complete menu URL          | `@biugle/biu-router` and Runtime | duplicate Code and deep-link tests                                           | PASS   |
| Official Layouts           | `@biugle/biu-preset`             | preset builds and Portal A/B browser checks                                  | PASS   |
| React Custom               | `layout-custom` and Runtime      | independent Custom build                                                     | PASS   |
| React/HTML/Vue integration | Adapter Contract                 | React, HTML and Vue APP builds                                               | PASS   |
| Zustand stores             | `@biugle/biu-store`              | scoped menu, Tabs and preference tests                                       | PASS   |
| i18n reload                | `@biugle/biu-i18n` and Runtime   | locale-aware menu request tests                                              | PASS   |
| Bridge security            | `@biugle/biu-bridge`             | Origin and sensitive-field tests                                             | PASS   |
| UI foundation              | `@biugle/biu-ui`                 | Message, Tooltip, Modal, Drawer and fire checks                              | PASS   |
| CLI quality                | ESLint, Prettier, Knip, Husky    | CI and local gates                                                           | PASS   |
| Release                    | Changesets and GitHub Actions    | version/publish workflow                                                     | PASS   |

Production gateway headers, SSO, monitoring SDK and business APIs remain deployment/project responsibilities.
