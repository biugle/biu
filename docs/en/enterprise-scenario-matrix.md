# Enterprise Scenario Matrix

| Scenario              | biu coverage                                                                   | Integration responsibility          |
| --------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| Portal Sidebar/Topbar | Official presets and shared Shell                                              | Portal menu and API configuration   |
| Independent APP       | Separate build, domain and lifecycle; fixed root page from `src/pages/index.*` | APP deployment and SSO              |
| React Custom          | Runtime Context without official navigation                                    | Project-owned shell and pages       |
| React/Vue/HTML/legacy | Adapter Contract or iframe boundary                                            | Framework adapter and business code |
| Menu and permissions  | Complete Code-chain URL and fail-closed filtering                              | Backend permission semantics        |
| Shared state          | Scoped Zustand stores and Bridge context                                       | Project-specific state extensions   |
| Unified UI            | `@biugle/biu-ui` Message, Tooltip, Modal, Drawer and fire                      | Business content                    |
| Release governance    | CLI, Knip, Changesets and GitHub Actions                                       | npm/Vercel credentials              |

The matrix covers the foundation boundary; real gateway, identity, observability and business API integration still require platform acceptance.
