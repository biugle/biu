import type { BiuEnvironmentConfig } from "@biugle/biu-cli";

export default {
  environment: "local",
  layout: {
    systemOptions: [
      { code: "main-a", label: "Portal A", url: "http://localhost:9001" },
      { code: "main-b", label: "Portal B", url: "http://localhost:9002" },
    ],
    activeSystem: "main-a",
  },
  remoteApps: {
    "child-app": {
      APP_URL: "http://localhost:8001",
      ALLOWED_ORIGINS: ["http://localhost:8001"],
      OVERLAY_MODE: "IFRAME",
    },
    "vue-child": {
      APP_URL: "http://localhost:8002",
      ALLOWED_ORIGINS: ["http://localhost:8002"],
      OVERLAY_MODE: "IFRAME",
    },
  },
  menu: { fallback: true },
} satisfies BiuEnvironmentConfig;
