# Biu 数据规范

本文件定义基座与门户、独立 APP、后端接口之间交换的数据边界。Demo 的 `src/mock/` 只提供示例数据；生产环境必须替换为权限接口、SSO 或业务服务，不把 Demo 账号、Token 或 Cookie 写入基座配置。

## 通用接口响应

```json
{ "code": 0, "message": "", "data": {} }
```

`code === 0` 才表示成功。失败时基座显示 `message`，不把请求头、Cookie、Token、密码或 session id 放入错误详情。

## 批量文本与筛选参数

`ProTextField` 的字段值仍是文本字符串，`onChange(value: string, items: string[])` 同时给出已提交文本与派生列表。普通输入即时回传原文；失焦时按已开启的分隔符解析、去掉空项并格式化。格式化导致文本变化时，再通过 `onChange` 回传规范文本和列表。批量应用按当前规则解析，再以换行连接有效项后提交。`items` 始终 trim、去空项并保留原有顺序和重复值，不自动去重或排序。取消草稿或异步 `onApply` 返回 false 时，查询状态和已提交字段值不变。

`splitString(str, separatorIncludesSpace = false, separatorIncludesComma = false)` 始终按换行/回车分割。空白和中英文逗号是独立可选规则，均默认关闭；未开启时保留词组内部空白和逗号。函数保持旧的一/二参数调用兼容，并对空字符串、纯空白和运行时非字符串输入返回 `[]`。

```ts
import { splitString } from "@biugle/react-components";

const value = "华东，华南\n唐宁";
const items = splitString(value, false, true);
// ["华东", "华南", "唐宁"]
```

组件不会把列表自动转换成 HTTP query/body 参数，也不决定接口需要字符串、数组还是重复参数。页面可只保存 `queryParams.keyword: string`；接口适配层根据后端契约明确解析和转换。主筛选区和更多筛选 Drawer 必须共享同一份受控状态，不能维护两套待提交查询值。

标准区域 Table 页的 `queryRegionRows(keyword, channel)` 是项目内的脱敏查询示例：关键字显式开启中英文逗号分割、保留内部空格，并转为小写；任意关键字匹配 `region`、`channel` 或 `manager` 即命中（关键字之间为 OR），渠道选择与关键字结果为 AND。空关键字列表不限制搜索范围。此规则由页面 `api.ts` 提供，不作为公共 Table 或 ProTextField 的默认业务过滤契约。

## Table 尺寸状态与余量分配

`Table`/`ProTable` 的列宽受控状态为 `Record<string, number | string>`，key 使用 `Column.key`；数字单位为像素，未主动调整的 fixed CSS/百分比宽度保留其原有表示。`actionColumn` 默认按浏览器视口宽度响应式设为 60px（小于 560px）、160px（560–799px）或 190px（800px 起）；显式列宽和受控映射优先。操作单元格里的 icon-only `ButtonList` 默认槽位上限为 1/3/5（都包含更多按钮），并受实际单元格宽度约束；调用方自定义 `maxCount`/`compactMaxCount` 优先。宽度状态回调与持久化不得把未调整的默认操作列冻结为测量像素。

`fillRemainingSpace?: boolean` 默认 true。默认模式保留主动拖动目标的精确宽度，提交时让其它普通列分配剩余空间；fixed、操作列及选择/展开辅助列不参与，所有分配遵守 minWidth/maxWidth。没有其它普通列或它们全部达到 maxWidth 时，才保留不可分配的余量。`fillRemainingSpace=false`、`elasticColumn=false` 或 `scroll.x="max-content"` 进入精确内容宽度的独立调整模式，不自动填充或补偿。

`onColumnWidthsChange(widths)` 一次回传包含提交后余量再分配的完整映射，调用方应应用整份新状态，不能只保存主动拖动列而丢弃其它普通列的最终宽度。`onColumnResize(key, width)` 仅报告主动调整目标；两个回调中的目标值一致，自动填充不能将它重新拉宽。无有效增量的操作不触发这两个回调。

```ts
type TableSizingState = {
  columnWidths: Record<string, number | string>;
  fillRemainingSpace: boolean;
};

const defaultSizingState: TableSizingState = {
  columnWidths: {},
  fillRemainingSpace: true,
};
```

尺寸状态属于页面的布局偏好，可放入标准页面 `storeState` 并通过 `dispatcher.setStoreState` 更新；接口查询条件继续放入 `queryParams`。尺寸回调不自动改写业务字段或生成 HTTP 参数。视口变化继续保护最近主动调整目标，并由其它普通列分配余量；重置或列结构变化释放该优先保护，等价的 columns/宽度映射副本不应被当成重置。

## 菜单树与权限

菜单树接口必须使用当前语言查询：`GET /portal-tree?portalCode=main-a&rootCode=PortalMainA&locale=en-US`；目录树同样携带 `locale`。新建菜单的 Code 和 path 每一段使用首字母大写驼峰，不使用短横线；`portalCode`、appId 和其他外部系统标识仍是独立字段。切换语言或调用 `reloadMenus()` 后，Runtime 会重新请求并按稳定菜单 Key 恢复 Tabs、收藏和最近使用记录。

```json
{
  "code": 0,
  "data": [
    {
      "code": "SystemConfig",
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
          "permissionCode": "SystemConfig:PageA"
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
menuKey:   SystemConfig/SystemBasic/PageA
routePath: /SystemConfig/SystemBasic/PageA
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

## Layout 水印与代码渲染

官方 Layout 可通过 `layout.watermark` 启用原生水印；该配置只包含展示参数，不包含用户身份、Token 或业务数据：

```ts
layout: {
  watermark: {
    enabled: true,
    text: ["Biu", "内部系统"],
    color: "#64748b",
    opacity: 0.12,
    rotate: -20,
    gap: [120, 90],
  },
}
```

`@biugle/watermark` 的 `createWatermark(target, options)` 返回 `update`/`destroy` 句柄；它是独立的 framework-neutral 包。`@biugle/render-code` 的 QR/Barcode 输出为 data URL、canvas 或 SVG，不进入 Bridge、菜单和认证协议。

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

默认认证页的账号、密码字段和登录/注册动作使用 `@biugle/react-components` 的 `TextField` 与 `Button`。Runtime 状态页、错误边界和远程 APP 重试使用 `Result`、`Alert`、`Button` 与 `biuMessage`；脱敏错误堆栈有意保留为只读 `<pre>`。个人信息与修改密码面板仍由 Portal 插槽负责，Demo 面板也使用同一套公开控件；真实项目自行提交和校验接口，密码不进入 Runtime 状态。

当 `auth.required === true` 时，未认证状态只渲染无导航认证页，不渲染 Header、Sidebar、Tabs 或 Breadcrumb；退出登录会清空当前页面状态并进入 `loginRoute`。登录和注册共用一个 `portalSlots.authPage` 组件，通过 `mode: "LOGIN" | "REGISTER"` 切换。未自定义时使用基座默认认证页，实际项目可在组件内调用 `useBiuAuthContext()` 与 SSO/业务接口完成认证。

用户菜单的个人信息与修改密码不是菜单路由。Portal 可传入 `portalSlots.profilePanel`、`portalSlots.passwordPanel`，面板函数接收 `close()`，由 `@biugle/react-components` 的 Pro `Dialog` 负责遮罩、Esc 和点击空白关闭；个人信息从 `auth.user` 读取或通过 `setAuth()` 更新，密码提交由 Portal 自己调用后端接口，基座不保存密码。

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
import { Dialog, Drawer, fire } from "@biugle/react-components";

fire(modal)({ title: "详情", children: <Profile /> });
fire(drawer)({ title: "筛选", placement: "right", children: <Filter /> });

const handle = fireNode(<CustomPanel />);
handle.close();

fire.render(({ close }) => <CustomPanel onClose={close} />);
```

`fire.node(node)` 用于直接挂载已创建的 React Node；`fire.render` 适合需要使用 `close()` 回调的自定义渲染函数。`fire(Component)(props)` 会注入 `open=true` 与 `onOpenChange`，因此自定义弹层可以复用同一套关闭契约。

状态兜底：Runtime 导出 `BiuStatusView`，`status` 可取 `400 | 401 | 403 | 404 | 500`。它只负责统一状态展示、错误详情脱敏和复制，不替业务判断 HTTP 状态；未知菜单深链由 Runtime 自动显示 404，`auth.required` 未通过时显示无导航认证页。

## Portal 自定义工具栏

需要同时支持桌面工具栏和窄屏折叠菜单的门户工具使用 `portalSlots.toolbarActions`。每项至少包含稳定的 `code`、`label` 和 `icon`，可选 `labelKey`、`tooltipKey`、动态 `value(context)`、`content(close)`、`onClick` 与 `mobile`。`value` 每次 locale、theme、timezone、direction 或门户自定义状态变化都会重新渲染，不能把当前部门、角色、时区等业务值写死在基座。任意 `toolbar` ReactNode 只承诺桌面插槽；中间 `workbar` 空间不足时可以隐藏。基座默认工具栏与 Portal 自定义 rail 分开计算宽度，默认自定义 rail 最大约占导航头部 20%，超出显示左右滚动按钮，不挤压通知、搜索、用户信息。
