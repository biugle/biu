# 文档中心

[English](README.en.md) · [项目首页](../README.md)

中文文档位于 `docs/`，英文版本位于 `docs/en/`。组件的逐属性 API 以对应公共包 README 和可运行 Demo 为入口；本文只维护导航。

## 入门与开发

| 中文                             | English                                           |
| -------------------------------- | ------------------------------------------------- |
| [使用手册](usage.md)             | [Usage](en/usage.md)                              |
| [开发与验收](development.md)     | [Development and verification](en/development.md) |
| [架构设计](design.md)            | [Architecture](en/design.md)                      |
| [公共包依赖图](package-graph.md) | [Package graph](en/package-graph.md)              |
| [多框架 Adapter](adapters.md)    | [Framework adapters](en/adapters.md)              |

## 公共 API 与数据

| 中文                                                                  | English                                                                            |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [基座、组件与公共能力规范](biu-foundation-components-capabilities.md) | [Foundation and component contracts](en/biu-foundation-components-capabilities.md) |
| [数据与安全契约](data-contracts.md)                                   | [Data and security contracts](en/data-contracts.md)                                |
| [HTTP API 与迁移](http.md)                                            | [HTTP API and migration](en/http.md)                                               |
| [Logger](logger.md)                                                   | [Logger](en/logger.md)                                                             |
| [Render Code](render-code.md)                                         | [Render Code](en/render-code.md)                                                   |
| [Watermark](watermark.md)                                             | [Watermark](en/watermark.md)                                                       |

## 部署与迁移

| 中文                                               | English                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| [Changesets 发布与 CI](release.md)                 | [Changesets releases and CI](en/release.md)                               |
| [Vercel 部署](vercel-deploy.md)                    | [Vercel deployment](en/vercel-deploy.md)                                  |
| [生产接入检查清单](production-checklist.md)        | [Production integration checklist](en/production-checklist.md)            |
| [企业场景与迁移](enterprise-scenario-matrix.md)    | [Enterprise scenarios and migration](en/enterprise-scenario-matrix.md)    |
| [UI 交互映射](ui-comparison.md)                    | [UI interaction mapping](en/ui-comparison.md)                             |
| [最终交付审计与优化清单](final-delivery-review.md) | [Delivery review and optimization checklist](en/final-delivery-review.md) |

HTTP 的逐方法兼容映射另见 [ts-xhttp 兼容矩阵](http-compatibility-matrix.md)。

综合规范、设计决策、组件/API 约束与浏览器回归只维护在[基座、组件与公共能力规范](biu-foundation-components-capabilities.md)；发布审计、当前验证结果和待办只维护在[最终交付审计](final-delivery-review.md)。原架构复审、实现对照表和干净验收的重复阶段记录已收敛到这些入口；不再维护 `docs/specs/` 或第二套评分、清理规则。
