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
  portal: { code: "main-a", menuRootCode: "portal-main-a", permissionPrefix: "portal-main-a" },
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
      code: "system-config",
      type: "DIRECTORY",
      titleKey: "系统配置",
      icon: "settings",
      children: [
        {
          code: "system-basic",
          type: "DIRECTORY",
          titleKey: "基础设置",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "基本信息", appId: "child-app", appPath: "/PageA" },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "参数设置", appId: "child-app", appPath: "/PageB" },
          ],
        },
        {
          code: "system-advanced",
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
      code: "enterprise-operations-center",
      type: "DIRECTORY",
      titleKey: "企业运营管理中心 Enterprise Operations Center",
      icon: "workspace",
      children: [
        {
          code: "international-governance",
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
          code: "security-compliance",
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
          code: "enterprise-home",
          type: "MENU",
          target: "PORTAL",
          titleKey: "运营中心首页 Enterprise Operations Home",
          path: "/Dashboard",
        },
      ],
    },
    {
      code: "system-management",
      type: "DIRECTORY",
      titleKey: "系统管理",
      icon: "workspace",
      children: [
        {
          code: "user-management",
          type: "DIRECTORY",
          titleKey: "用户管理",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "用户列表", appId: "child-app", appPath: "/PageA" },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "用户详情", appId: "child-app", appPath: "/PageB" },
          ],
        },
        {
          code: "role-management",
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
      code: "log-center",
      type: "DIRECTORY",
      titleKey: "日志中心",
      icon: "records",
      children: [
        {
          code: "operation-log",
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
          code: "access-log",
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
      code: "message-center",
      type: "DIRECTORY",
      titleKey: "消息中心",
      icon: "center",
      children: [
        {
          code: "notice-management",
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
          code: "template-management",
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
      code: "data-center",
      type: "DIRECTORY",
      titleKey: "数据管理",
      icon: "folder",
      children: [
        {
          code: "data-query",
          type: "DIRECTORY",
          titleKey: "数据查询",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "数据列表", appId: "child-app", appPath: "/PageA" },
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "查询概览", path: "/Dashboard" },
          ],
        },
        {
          code: "data-maintenance",
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
      code: "permission-center",
      type: "DIRECTORY",
      titleKey: "权限管理",
      icon: "settings",
      children: [
        {
          code: "resource-list",
          type: "DIRECTORY",
          titleKey: "资源目录",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "资源列表", appId: "child-app", appPath: "/PageA" },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "资源详情", appId: "child-app", appPath: "/PageB" },
          ],
        },
        {
          code: "permission-policy",
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
      code: "task-center",
      type: "DIRECTORY",
      titleKey: "任务中心",
      icon: "dashboard",
      children: [
        {
          code: "task-config",
          type: "DIRECTORY",
          titleKey: "任务配置",
          children: [
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "任务概览", path: "/Dashboard" },
            { code: "PageA", type: "MENU", target: "APP", titleKey: "任务编辑", appId: "child-app", appPath: "/PageA" },
          ],
        },
        {
          code: "task-record",
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
      code: "report-center",
      type: "DIRECTORY",
      titleKey: "报表中心",
      icon: "records",
      children: [
        {
          code: "report-list",
          type: "DIRECTORY",
          titleKey: "报表目录",
          children: [
            { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "报表首页", path: "/Overview" },
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "报表概览", path: "/Dashboard" },
          ],
        },
        {
          code: "report-settings",
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
      code: "account-center",
      type: "DIRECTORY",
      titleKey: "用户中心",
      icon: "center",
      children: [
        {
          code: "account-settings",
          type: "DIRECTORY",
          titleKey: "账户设置",
          children: [
            { code: "PageA", type: "MENU", target: "APP", titleKey: "账户信息", appId: "child-app", appPath: "/PageA" },
            { code: "PageB", type: "MENU", target: "APP", titleKey: "安全设置", appId: "child-app", appPath: "/PageB" },
          ],
        },
        {
          code: "login-record",
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
      code: "api-center",
      type: "DIRECTORY",
      titleKey: "接口管理",
      icon: "workspace",
      children: [
        {
          code: "api-settings",
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
          code: "api-record",
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
      code: "dictionary-center",
      type: "DIRECTORY",
      titleKey: "字典管理",
      icon: "folder",
      children: [
        {
          code: "dictionary-type",
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
          code: "dictionary-item",
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
      code: "help-center",
      type: "DIRECTORY",
      titleKey: "帮助中心",
      icon: "about",
      children: [
        {
          code: "document-management",
          type: "DIRECTORY",
          titleKey: "文档管理",
          children: [
            { code: "Overview", type: "MENU", target: "PORTAL", titleKey: "文档首页", path: "/Overview" },
            { code: "PageA", type: "MENU", target: "APP", titleKey: "文档详情", appId: "child-app", appPath: "/PageA" },
          ],
        },
        {
          code: "faq-management",
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
      code: "monitor-center",
      type: "DIRECTORY",
      titleKey: "系统监控",
      icon: "dashboard",
      children: [
        {
          code: "service-status",
          type: "DIRECTORY",
          titleKey: "服务状态",
          children: [
            { code: "Dashboard", type: "MENU", target: "PORTAL", titleKey: "服务概览", path: "/Dashboard" },
            { code: "PageA", type: "MENU", target: "APP", titleKey: "服务详情", appId: "child-app", appPath: "/PageA" },
          ],
        },
        {
          code: "alert-record",
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
