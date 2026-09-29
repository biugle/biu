import { demoAuth } from "./src/mock/auth";
import { demoNotifications } from "./src/mock/notifications";

export default {
  appId: "main-a",
  projectType: "PORTAL",
  locale: "zh-CN",
  framework: "react",
  auth: demoAuth,
  portalSlots: { source: "./src/portal-slots.tsx" },
  dev: { port: 9001 },
  portal: { code: "main-a", menuRootCode: "PortalMainA", permissionPrefix: "PortalMainA" },
  layout: {
    preset: "sidebar",
    menuMode: "MULTI_LEVEL",
    tabs: true,
    breadcrumb: true,
    brandLabel: "Biu",
    brandSubtitle: "Operations Portal",
    showSearch: true,
    showNotifications: true,
    user: { name: "演示用户", role: "Portal Admin" },
    notificationItems: demoNotifications,
  },
  menu: { fallback: true },
  localMenuTree: [
    {
      code: "PlatformCapabilities",
      type: "DIRECTORY",
      titleKey: "平台能力",
      icon: "dashboard",
      children: [
        {
          code: "PlatformCapabilities",
          type: "MENU",
          target: "PORTAL",
          titleKey: "基座能力展示",
          path: "/PlatformCapabilities",
        },
        {
          code: "RuntimeCapabilities",
          type: "MENU",
          target: "PORTAL",
          titleKey: "Runtime 能力展示",
          path: "/RuntimeCapabilities",
        },
        {
          code: "RouterMenuShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "路由与菜单展示",
          path: "/RouterMenuShowcase",
        },
        {
          code: "OverlayShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "Drawer / Dialog 展示",
          path: "/OverlayShowcase",
        },
        {
          code: "TooltipEllipsisShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "Tooltip / Ellipsis 展示",
          path: "/TooltipEllipsisShowcase",
        },
      ],
    },
    {
      code: "ComponentCapabilities",
      type: "DIRECTORY",
      titleKey: "组件能力",
      icon: "workspace",
      children: [
        {
          code: "ComponentUIShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "组件能力展示",
          path: "/ComponentUIShowcase",
        },
        { code: "IconsSearch", type: "MENU", target: "PORTAL", titleKey: "Icons 快速查询", path: "/IconsSearch" },
      ],
    },
    {
      code: "FormCapabilities",
      type: "DIRECTORY",
      titleKey: "Form 能力",
      icon: "settings",
      children: [
        { code: "FormShowcase", type: "MENU", target: "PORTAL", titleKey: "Form 能力展示", path: "/FormShowcase" },
      ],
    },
    {
      code: "TableCapabilities",
      type: "DIRECTORY",
      titleKey: "Table 能力",
      icon: "records",
      children: [
        {
          code: "TableShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "Table 能力展示",
          path: "/TableShowcase",
        },
      ],
    },
    {
      code: "ServiceCapabilities",
      type: "DIRECTORY",
      titleKey: "基础服务",
      icon: "folder",
      children: [
        { code: "HttpShowcase", type: "MENU", target: "PORTAL", titleKey: "HTTP 能力展示", path: "/HttpShowcase" },
        { code: "I18nShowcase", type: "MENU", target: "PORTAL", titleKey: "i18n 能力展示", path: "/I18nShowcase" },
        {
          code: "TanstackQueryShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "TanStack Query 能力展示",
          path: "/TanstackQueryShowcase",
        },
        { code: "StoreShowcase", type: "MENU", target: "PORTAL", titleKey: "Store 能力展示", path: "/StoreShowcase" },
        {
          code: "RenderCodeShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "Render Code 能力展示",
          path: "/RenderCodeShowcase",
        },
        {
          code: "WatermarkShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "Watermark 能力展示",
          path: "/WatermarkShowcase",
        },
        {
          code: "LoggerShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "Logger 能力展示",
          path: "/LoggerShowcase",
        },
      ],
    },
    {
      code: "SystemConfig",
      type: "DIRECTORY",
      titleKey: "系统配置",
      icon: "settings",
      children: [
        {
          code: "SystemBasic",
          type: "DIRECTORY",
          titleKey: "基础设置",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "基本信息", appId: "child-app", appPath: "/PageA" },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "参数设置", appId: "child-app", appPath: "/PageB" },
          ],
        },
        {
          code: "SystemAdvanced",
          type: "DIRECTORY",
          titleKey: "高级设置",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "高级信息", appId: "child-app", appPath: "/PageA" },
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "配置概览", path: "/Dashboard" },
          ],
        },
        {
          code: "FoundationShowcase",
          type: "MENU",
          target: "PORTAL",
          titleKey: "基座能力验收 Foundation Showcase",
          path: "/FoundationShowcase",
        },
        { code: "VuePage", type: "MENU", target: "APP", titleKey: "系统预览", appId: "vue-child", appPath: "/VuePage" },
      ],
    },
    {
      code: "EnterpriseOperationsCenter",
      type: "DIRECTORY",
      titleKey: "企业运营管理中心 Enterprise Operations Center",
      icon: "workspace",
      children: [
        {
          code: "InternationalGovernance",
          type: "DIRECTORY",
          titleKey: "International Configuration & Governance",
          children: [
            {
              code: "LongPolicyPage",
              type: "MENU",
              target: "APP",
              titleKey: "跨区域业务参数与权限策略管理 International Policy Settings",
              appId: "child-app",
              appPath: "/PageA",
            },
            {
              code: "LongAuditPage",
              type: "MENU",
              target: "APP",
              titleKey: "Long Running Audit Configuration and Access Review Page",
              appId: "child-app",
              appPath: "/PageB",
            },
          ],
        },
        {
          code: "SecurityCompliance",
          type: "DIRECTORY",
          titleKey: "安全合规与审计中心 Security Compliance",
          children: [
            {
              code: "ComplianceOverview",
              type: "MENU",
              target: "PORTAL",
              titleKey: "系统级运行状态与安全审计明细 System Audit Details",
              path: "/Dashboard",
            },
            {
              code: "ComplianceReport",
              type: "MENU",
              target: "PORTAL",
              titleKey: "Enterprise Security Compliance Report Overview",
              path: "/Overview",
            },
          ],
        },
        {
          code: "EnterpriseHome",
          type: "MENU",
          target: "PORTAL",
          titleKey: "运营中心首页 Enterprise Operations Home",
          path: "/Dashboard",
        },
      ],
    },
    {
      code: "SystemManagement",
      type: "DIRECTORY",
      titleKey: "系统管理",
      icon: "workspace",
      children: [
        {
          code: "UserManagement",
          type: "DIRECTORY",
          titleKey: "用户管理",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "用户列表", appId: "child-app", appPath: "/PageA" },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "用户详情", appId: "child-app", appPath: "/PageB" },
          ],
        },
        {
          code: "RoleManagement",
          type: "DIRECTORY",
          titleKey: "角色管理",
          children: [
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "角色列表",
              appId: "vue-child",
              appPath: "/VuePage",
            },
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "角色概览", path: "/Dashboard" },
          ],
        },
        { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "系统总览", path: "/Overview" },
      ],
    },
    {
      code: "LogCenter",
      type: "DIRECTORY",
      titleKey: "日志中心",
      icon: "records",
      children: [
        {
          code: "OperationLog",
          type: "DIRECTORY",
          titleKey: "操作日志",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "日志查询", appId: "child-app", appPath: "/PageA" },
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "日志详情",
              appId: "vue-child",
              appPath: "/VuePage",
            },
          ],
        },
        {
          code: "AccessLog",
          type: "DIRECTORY",
          titleKey: "访问日志",
          children: [
            { code: "PageB", type: "MENU", target: "APP", titleKey: "访问记录", appId: "child-app", appPath: "/PageB" },
            { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "访问概览", path: "/Overview" },
          ],
        },
        { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "日志统计", path: "/Dashboard" },
      ],
    },
    {
      code: "MessageCenter",
      type: "DIRECTORY",
      titleKey: "消息中心",
      icon: "center",
      children: [
        {
          code: "NoticeManagement",
          type: "DIRECTORY",
          titleKey: "通知管理",
          children: [
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "通知列表",
              appId: "vue-child",
              appPath: "/VuePage",
            },
            { code: "PageA", type: "MENU", target: "APP", titleKey: "通知详情", appId: "child-app", appPath: "/PageA" },
          ],
        },
        {
          code: "TemplateManagement",
          type: "DIRECTORY",
          titleKey: "模板管理",
          children: [
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "模板概览", path: "/Dashboard" },
            { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "模板统计", path: "/Overview" },
          ],
        },
        { code: "PageB", type: "MENU", target: "APP", titleKey: "消息设置", appId: "child-app", appPath: "/PageB" },
      ],
    },
    {
      code: "DataCenter",
      type: "DIRECTORY",
      titleKey: "数据管理",
      icon: "folder",
      children: [
        {
          code: "DataQuery",
          type: "DIRECTORY",
          titleKey: "数据查询",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "数据列表", appId: "child-app", appPath: "/PageA" },
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "查询概览", path: "/Dashboard" },
          ],
        },
        {
          code: "DataMaintenance",
          type: "DIRECTORY",
          titleKey: "数据维护",
          children: [
            { code: "PageB", type: "MENU", target: "APP", titleKey: "数据编辑", appId: "child-app", appPath: "/PageB" },
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "数据预览",
              appId: "vue-child",
              appPath: "/VuePage",
            },
          ],
        },
        { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "数据总览", path: "/Overview" },
      ],
    },
    {
      code: "PermissionCenter",
      type: "DIRECTORY",
      titleKey: "权限管理",
      icon: "settings",
      children: [
        {
          code: "ResourceList",
          type: "DIRECTORY",
          titleKey: "资源目录",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "资源列表", appId: "child-app", appPath: "/PageA" },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "资源详情", appId: "child-app", appPath: "/PageB" },
          ],
        },
        {
          code: "PermissionPolicy",
          type: "DIRECTORY",
          titleKey: "权限策略",
          children: [
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "策略列表",
              appId: "vue-child",
              appPath: "/VuePage",
            },
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "策略概览", path: "/Dashboard" },
          ],
        },
        { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "权限总览", path: "/Overview" },
      ],
    },
    {
      code: "TaskCenter",
      type: "DIRECTORY",
      titleKey: "任务中心",
      icon: "dashboard",
      children: [
        {
          code: "TaskConfig",
          type: "DIRECTORY",
          titleKey: "任务配置",
          children: [
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "任务概览", path: "/Dashboard" },
            { code: "PageA", type: "MENU", target: "APP", titleKey: "任务编辑", appId: "child-app", appPath: "/PageA" },
          ],
        },
        {
          code: "TaskRecord",
          type: "DIRECTORY",
          titleKey: "执行记录",
          children: [
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "执行详情",
              appId: "vue-child",
              appPath: "/VuePage",
            },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "执行日志", appId: "child-app", appPath: "/PageB" },
          ],
        },
        { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "任务统计", path: "/Overview" },
      ],
    },
    {
      code: "ReportCenter",
      type: "DIRECTORY",
      titleKey: "报表中心",
      icon: "records",
      children: [
        {
          code: "ReportList",
          type: "DIRECTORY",
          titleKey: "报表目录",
          children: [
            { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "报表首页", path: "/Overview" },
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "报表概览", path: "/Dashboard" },
          ],
        },
        {
          code: "ReportSettings",
          type: "DIRECTORY",
          titleKey: "统计配置",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "统计设置", appId: "child-app", appPath: "/PageA" },
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "统计预览",
              appId: "vue-child",
              appPath: "/VuePage",
            },
          ],
        },
        { code: "PageB", type: "MENU", target: "APP", titleKey: "报表设置", appId: "child-app", appPath: "/PageB" },
      ],
    },
    {
      code: "AccountCenter",
      type: "DIRECTORY",
      titleKey: "用户中心",
      icon: "center",
      children: [
        {
          code: "AccountSettings",
          type: "DIRECTORY",
          titleKey: "账户设置",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "账户信息", appId: "child-app", appPath: "/PageA" },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "安全设置", appId: "child-app", appPath: "/PageB" },
          ],
        },
        {
          code: "LoginRecord",
          type: "DIRECTORY",
          titleKey: "登录记录",
          children: [
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "登录详情",
              appId: "vue-child",
              appPath: "/VuePage",
            },
            { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "登录概览", path: "/Overview" },
          ],
        },
        { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "个人概览", path: "/Dashboard" },
      ],
    },
    {
      code: "ApiCenter",
      type: "DIRECTORY",
      titleKey: "接口管理",
      icon: "workspace",
      children: [
        {
          code: "ApiSettings",
          type: "DIRECTORY",
          titleKey: "接口配置",
          children: [
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "接口列表",
              appId: "vue-child",
              appPath: "/VuePage",
            },
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "接口概览", path: "/Dashboard" },
          ],
        },
        {
          code: "ApiRecord",
          type: "DIRECTORY",
          titleKey: "调用记录",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "调用详情", appId: "child-app", appPath: "/PageA" },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "调用日志", appId: "child-app", appPath: "/PageB" },
          ],
        },
        { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "接口统计", path: "/Overview" },
      ],
    },
    {
      code: "DictionaryCenter",
      type: "DIRECTORY",
      titleKey: "字典管理",
      icon: "folder",
      children: [
        {
          code: "DictionaryType",
          type: "DIRECTORY",
          titleKey: "字典分类",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "分类列表", appId: "child-app", appPath: "/PageA" },
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "分类预览",
              appId: "vue-child",
              appPath: "/VuePage",
            },
          ],
        },
        {
          code: "DictionaryItem",
          type: "DIRECTORY",
          titleKey: "字典明细",
          children: [
            { code: "PageB", type: "MENU", target: "APP", titleKey: "明细列表", appId: "child-app", appPath: "/PageB" },
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "明细概览", path: "/Dashboard" },
          ],
        },
        { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "字典总览", path: "/Overview" },
      ],
    },
    {
      code: "HelpCenter",
      type: "DIRECTORY",
      titleKey: "帮助中心",
      icon: "about",
      children: [
        {
          code: "DocumentManagement",
          type: "DIRECTORY",
          titleKey: "文档管理",
          children: [
            { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "文档首页", path: "/Overview" },
            { code: "PageA", type: "MENU", target: "APP", titleKey: "文档详情", appId: "child-app", appPath: "/PageA" },
          ],
        },
        {
          code: "FaqManagement",
          type: "DIRECTORY",
          titleKey: "常见问题",
          children: [
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "问题列表",
              appId: "vue-child",
              appPath: "/VuePage",
            },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "问题详情", appId: "child-app", appPath: "/PageB" },
          ],
        },
        { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "帮助概览", path: "/Dashboard" },
      ],
    },
    {
      code: "MonitorCenter",
      type: "DIRECTORY",
      titleKey: "系统监控",
      icon: "dashboard",
      children: [
        {
          code: "ServiceStatus",
          type: "DIRECTORY",
          titleKey: "服务状态",
          children: [
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "服务概览", path: "/Dashboard" },
            { code: "PageA", type: "MENU", target: "APP", titleKey: "服务详情", appId: "child-app", appPath: "/PageA" },
          ],
        },
        {
          code: "AlertRecord",
          type: "DIRECTORY",
          titleKey: "告警记录",
          children: [
            { code: "PageB", type: "MENU", target: "APP", titleKey: "告警详情", appId: "child-app", appPath: "/PageB" },
            {
              code: "VuePage",
              type: "MENU",
              target: "APP",
              titleKey: "告警预览",
              appId: "vue-child",
              appPath: "/VuePage",
            },
          ],
        },
        { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "监控总览", path: "/Overview" },
      ],
    },
  ],
  routes: { files: ["local-routes/index.ts"] },
};
