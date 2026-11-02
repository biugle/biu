# Security Policy

## 报告安全问题

请不要在公开 Issue 中发布可利用的漏洞、Token、Cookie、密码或真实用户数据。2026-10-30 的 GitHub API 检查确认仓库尚未启用 private vulnerability reporting，目前没有经过确认的私密报告渠道。请只在公开 Issue 中请求维护者提供私密联系方式，不附漏洞细节。获得私密渠道后，报告应提供：

- 受影响的版本或 commit；
- 可复现步骤和最小示例；
- 影响范围和建议修复方向。

仓库管理员需在下一次公开发布前启用 GitHub private vulnerability reporting，或公布经过确认的私密联系方式。启用后可从 [Security Advisories 页面](https://github.com/biugle/biu/security/advisories) 的 **Report a vulnerability** 入口私密报告。

仓库不内置生产密钥或登录服务；Runtime/Bridge 的公开身份协议不负责传输凭证。HTTP 包允许项目按自己的认证策略配置请求 Header。Demo 中的账号只用于本地演示，生产项目必须接入自己的 SSO、网关或认证服务。

## 支持版本

当前尚未公布安全维护版本范围或响应时限。维护者需在下一次公开发布前明确受支持的版本及停止支持政策；在此之前，请在报告中注明确切版本或 commit，不要假定所有历史版本都会获得回补。

## 安全边界

- iframe Bridge 只传递脱敏身份、偏好和结构化事件。
- 调用方不得把 Token、Cookie、密码或 session id 放入 Runtime Store、身份扩展字段或应用事件。Bridge 的 `publicAuthContext` 会过滤身份扩展中匹配敏感字段名的键；Store 和任意 `APP_EVENT` payload 不提供通用自动脱敏，调用方仍须审查其内容。
- 远程 APP 必须配置 ALLOWED_ORIGINS。
- 错误详情会做敏感字段脱敏，但生产仍应接入自己的监控和日志脱敏策略。
