# Biu 数据规范

本文件定义基座与门户、独立 APP、后端接口之间交换的数据边界。Demo 的 `src/mock/` 只提供示例数据；生产环境必须替换为权限接口、SSO 或业务服务，不把 Demo 账号、Token 或 Cookie 写入基座配置。

## 通用接口响应

```json
{ "code": 0, "message": "", "data": {} }
```

`code === 0` 才表示成功。失败时基座显示 `message`，不把请求头、Cookie、Token、密码或 session id 放入错误详情。

## 菜单树与权限

菜单树接口必须使用当前语言查询：`GET /portal-tree?portalCode=main-a&rootCode=portal-main-a&locale=en-US`；目录树同样携带 `locale`。切换语言或调用 `reloadMenus()` 后，Runtime 会重新请求并按稳定菜单 Key 恢复 Tabs、收藏和最近使用记录。

```json
{
  "code": 0,
  "data": [
    {
      "code": "system-config",
      "type": "DIRECTORY",
      "titleKey": "系统配置",
      "icon": "settings",
      "children": [
        {
          "code": "PageA",
          "type": "MENU",
          "target": "APP",
          "titleKey": "基本信息",
          "appId": "child-app",
          "appPath": "/PageA",
          "permissionCode": "system-config:PageA"
        }
      ]
    }
  ]
}
```

菜单 `code`、`type`、`target`、`path/appPath` 必须通过 CLI/Runtime 校验。一级目录是双栏模式的分组来源，目录和菜单可以同级，目录可以继续递归。普通菜单不配置图标；目录图标只接受显式配置，不通过标题或 Code 猜测。权限接口返回 `string[]`，启用权限接口后接口失败按 fail-closed 处理。

### 菜单 URL 与唯一身份

菜单页面的标准宿主 URL 由完整的目录 `code` 链路生成，示例：

```text
menuKey:   system-config/system-basic/PageA
routePath: /system-config/system-basic/PageA
```

`menuKey`/`routePath` 不使用标题，因此不随语言切换变化。后端如果提供以菜单 Code 结尾的完整 `path`，它就是 `routePath`；否则基座按菜单层级 Code 生成 `routePath`。同名末级菜单必须依靠完整链路区分。单段 `path` 只作为旧业务路由兼容别名，只有唯一时才允许解析，不能作为权限或审计的唯一身份。`appPath` 是远程 APP 在 iframe 内部使用的页面路径，与宿主 `routePath` 分离。独立 APP 的 CLI 合成根会标记 `__BIU_SYNTHETIC_ROOT`，不进入分享 URL 和面包屑。

权限接口和审计事件应至少关联 `permissionCode`、`menuKey`、`routePath`、`portalCode`、`appId`；Runtime 优先匹配后端 `permissionCode`，也支持完整 `menuKey` 作为权限值。前端导航 API 对重复 Code 必须使用 `navigateByKey()`，不能按 URL 最后一段或重复 Code 猜测页面。

## 语言资源

`localeUrl` 是可选的业务语言资源入口，Runtime 会追加 `locale` 查询参数，也支持 URL 中的 `{locale}` 占位符。推荐响应：

```json
{
  "code": 0,
  "data": {
    "key": "en-US",
    "desc": "English",
    "translation": { "系统配置": "System configuration" }
  }
}
```

也兼容 `translations`、`messages` 字段或以 locale 为 key 的资源对象。缺少目标语言时按英文、中文、key 回退；无效资源不应阻断菜单和页面启动。

## Portal 与 APP 配置

```ts
remoteApps: {
  "child-app": {
    APP_URL: "https://app.example.com",
    ALLOWED_ORIGINS: ["https://app.example.com"],
    OVERLAY_MODE: "IFRAME"
  }
}
```

`APP_URL` 只允许 HTTP(S)，跨域时必须有精确 `ALLOWED_ORIGINS`。Portal 与 APP 分别构建和部署，Portal 不打包 APP 页面源码。

## 通知

```ts
type Notification = {
  id: string;
  title: string;
  description?: string;
  time?: string;
  read?: boolean;
};
```

Demo 可在 `src/mock/notifications.ts` 提供数组；生产可以由接口返回同一结构。通知按钮只负责展示和关闭，不在基座内假设已读接口。

## 用户与认证

```ts
type AuthContext = {
  mode: "SSO" | "NONE";
  authenticated: boolean;
  user?: {
    id?: string;
    name: string;
    role?: string;
    avatar?: string;
    roles?: string[];
    permissions?: string[];
    extra?: Record<string, unknown>;
  };
};
```

`extra` 只允许非敏感业务扩展字段。Token、Cookie、密码和 session id 由 SSO Cookie/网关管理，不进入 Runtime Store、生成入口或 `postMessage`。基座通过 `login/logout/refreshAuth/setAuth` 暴露状态出口，实际认证由门户或统一身份服务决定。

当 `auth.required === true` 时，未认证状态只渲染无导航认证页，不渲染 Header、Sidebar、Tabs 或 Breadcrumb；退出登录会清空当前页面状态并进入 `loginRoute`。登录和注册共用一个 `portalSlots.authPage` 组件，通过 `mode: "LOGIN" | "REGISTER"` 切换。未自定义时使用基座默认认证页，实际项目可在组件内调用 `useBiuAuthContext()` 与 SSO/业务接口完成认证。

用户菜单的个人信息与修改密码不是菜单路由。Portal 可传入 `portalSlots.profilePanel`、`portalSlots.passwordPanel`，面板函数接收 `close()`，由基座 `BiuModal` 负责遮罩、Esc 和点击空白关闭；个人信息从 `auth.user` 读取或通过 `setAuth()` 更新，密码提交由 Portal 自己调用后端接口，基座不保存密码。

## 菜单本地状态

- 收藏：`localStorage`，按 `PORTAL_CODE + ENVIRONMENT` 隔离，最多 100 条。
- 最近使用：`localStorage`，同一 scope，最多 10 条，保存稳定 menu key 和当时的中文路径快照。
- Tabs：`sessionStorage`，按同一 scope 保存顺序和当前页。
- 语言、主题、方向、时区：`sessionStorage`，按同一 scope 保存，空值或非法值使用合法默认值。

旧收藏/最近使用记录不因后端菜单变化强行删除；点击后由页面不存在兜底负责提示。

## Bridge 与生命周期

宿主向 APP 发送 `HOST_CONTEXT`，包含 `PORTAL_CODE`、`ENVIRONMENT`、`LOCALE`、`THEME`、`DIRECTION`、`TIMEZONE`、`CURRENT_CODE` 和脱敏 `AUTH`。APP 可发送带自身 `VERSION` 的 `BIU_READY`、`UI_OVERLAY_STATE`、`APP_EVENT`；宿主只在已校验的 iframe Origin 上接受版本握手。生命周期统一为 `LOAD_START`、`READY`、`ERROR`、`UNLOAD`，Shell 另有 `MOUNT`、`UNMOUNT` 和导航 `BEFORE`/`AFTER`/`ERROR` 钩子。遮罩和事件只传结构化状态，不传 HTML、DOM、脚本、Token 或 Cookie。

## 更新与错误

更新清单至少包含 `version`、`buildId`、`environment`、`portalCode`、`selectedCodes` 和发布资源入口。Runtime 首次建立基线，用户导航等操作时单次检查，优先比较 `buildId`；清单不是合法 JSON 或没有 `buildId` 时回退比较原始文本。不轮询、不自动刷新，启动时网络失败会在下一次用户操作时重新建立基线。错误事件只保留脱敏后的错误文本、Code、APP ID 和组件上下文；错误界面支持复制详情。

`auth.enabled=false` 表示关闭基座默认登录/注册入口；自定义认证仍由项目负责。`APP_EVENT` 的 payload 为 `{ name, payload, source?, timestamp }`，事件名限制为非空短字符串，跨 iframe 必须通过允许的 Origin 校验。React 项目可使用独立的 `fire` 方法将任意 React 内容挂载到宿主 `body` 下，并获得可编程关闭的句柄；业务内容和接口请求不属于基座契约。

```tsx
import { drawer, fire, fireNode, fireRender, modal } from "@biugle/biu-ui";

fire(modal)({ title: "详情", children: <Profile /> });
fire(drawer)({ title: "筛选", placement: "right", children: <Filter /> });

const handle = fireNode(<CustomPanel />);
handle.close();

fireRender((close) => <CustomPanel onClose={close} />);
```

`fire(node)` 与 `fireNode(node)` 都用于直接挂载已创建的 React Node；`fireRender` 适合需要使用 `close()` 回调的自定义渲染函数。`fire(Component)(props)` 仍兼容普通 React 组件，并会注入 `open=true` 与 `onClose`，因此自定义弹层可以复用同一套关闭契约。

状态兜底：Runtime 导出 `BiuStatusView`，`status` 可取 `400 | 401 | 403 | 404 | 500`。它只负责统一状态展示、错误详情脱敏和复制，不替业务判断 HTTP 状态；未知菜单深链由 Runtime 自动显示 404，`auth.required` 未通过时显示无导航认证页。

## Portal 自定义工具栏

需要同时支持桌面工具栏和窄屏折叠菜单的门户工具使用 `portalSlots.toolbarActions`。每项至少包含稳定的 `code`、`label` 和 `icon`，可选 `labelKey`、`tooltipKey`、动态 `value(context)`、`content(close)`、`onClick` 与 `mobile`。`value` 每次 locale、theme、timezone、direction 或门户自定义状态变化都会重新渲染，不能把当前部门、角色、时区等业务值写死在基座。任意 `toolbar` ReactNode 只承诺桌面插槽；中间 `workbar` 空间不足时可以隐藏。基座默认工具栏与 Portal 自定义 rail 分开计算宽度，默认自定义 rail 最大约占导航头部 20%，超出显示左右滚动按钮，不挤压通知、搜索、用户信息。
