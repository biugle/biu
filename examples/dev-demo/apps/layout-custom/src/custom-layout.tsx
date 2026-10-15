import type { LayoutContentProps } from "@biugle/biu-runtime";
import { useBiuContext } from "@biugle/biu-runtime";
import { Button } from "@biugle/react-components";
import "@biugle/react-components/styles.css";

export default function ProjectCustomLayout({ children }: LayoutContentProps) {
  const { appId, currentPath, locale, setLocale } = useBiuContext();
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#172033",
        background: "#f6f8fc",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px 28px",
          background: "#172033",
          color: "#fff",
        }}
      >
        <strong>{appId} / Project Shell</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>{currentPath || "/"}</span>
          <Button
            type="default"
            variant="outlined"
            size="small"
            onClick={() => setLocale(locale === "en-US" ? "zh-CN" : "en-US")}
          >
            {locale === "en-US" ? "中文" : "EN"}
          </Button>
        </div>
      </header>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: 24 }}>{children}</div>
    </div>
  );
}
