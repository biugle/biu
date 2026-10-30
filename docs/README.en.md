# Documentation

[中文](README.md) · [Project README](../README.en.md)

Chinese documents live in `docs/`; English counterparts live in `docs/en/`. Individual public-package READMEs and runnable Demos provide property-by-property API references. This page is a navigation index.

## Getting started and development

| English                                           | 中文                             |
| ------------------------------------------------- | -------------------------------- |
| [Usage](en/usage.md)                              | [使用手册](usage.md)             |
| [Development and verification](en/development.md) | [开发与验收](development.md)     |
| [Architecture](en/design.md)                      | [架构设计](design.md)            |
| [Package graph](en/package-graph.md)              | [公共包依赖图](package-graph.md) |
| [Framework adapters](en/adapters.md)              | [多框架 Adapter](adapters.md)    |

## Public APIs and data

| English                                                                            | 中文                                                                  |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [Foundation and component contracts](en/biu-foundation-components-capabilities.md) | [基座、组件与公共能力规范](biu-foundation-components-capabilities.md) |
| [Data and security contracts](en/data-contracts.md)                                | [数据与安全契约](data-contracts.md)                                   |
| [HTTP API and migration](en/http.md)                                               | [HTTP API 与迁移](http.md)                                            |
| [Logger](en/logger.md)                                                             | [Logger](logger.md)                                                   |
| [Render Code](en/render-code.md)                                                   | [Render Code](render-code.md)                                         |
| [Watermark](en/watermark.md)                                                       | [Watermark](watermark.md)                                             |

## Deployment and migration

| English                                                                   | 中文                                               |
| ------------------------------------------------------------------------- | -------------------------------------------------- |
| [Changesets releases and CI](en/release.md)                               | [Changesets 发布与 CI](release.md)                 |
| [Vercel deployment](en/vercel-deploy.md)                                  | [Vercel 部署](vercel-deploy.md)                    |
| [Production integration checklist](en/production-checklist.md)            | [生产接入检查清单](production-checklist.md)        |
| [Enterprise scenarios and migration](en/enterprise-scenario-matrix.md)    | [企业场景与迁移](enterprise-scenario-matrix.md)    |
| [UI interaction mapping](en/ui-comparison.md)                             | [UI 交互映射](ui-comparison.md)                    |
| [Delivery review and optimization checklist](en/final-delivery-review.md) | [最终交付审计与优化清单](final-delivery-review.md) |

For method-level HTTP compatibility, see the [ts-xhttp compatibility matrix (Chinese)](http-compatibility-matrix.md).

[Foundation and component contracts](en/biu-foundation-components-capabilities.md) is the single comprehensive contract and browser-regression reference. [Delivery review](en/final-delivery-review.md) records release audits, current verification results and outstanding work. The former architecture review, implementation matrix and clean-acceptance phase records have been consolidated into these references. Do not maintain `docs/specs/` or a second set of scores or cleanup rules.
