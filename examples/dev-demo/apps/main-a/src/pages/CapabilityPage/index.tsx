import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { Grid, PageBox, Stack } from "@biugle/react-components";
import { useBiuI18n } from "@biugle/biu-runtime";
import { LocalizedDemoTree } from "./localization.js";
import "@biugle/react-components/styles.css";
import "@biugle/react-table/styles.css";
import "./styles.css";

export type { CapabilityApiRow } from "./api-types.js";
export { LocalizedDemoTree } from "./localization.js";
export { normalizeCapabilityApiRows } from "./api-normalization.js";
export { CapabilityApiTable } from "./api-table.js";

export function CapabilityApiRegion({ children }: { children: ReactNode }) {
  return <div className="biu-capability-region-api">{children}</div>;
}

export function CapabilityApiBlock({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="biu-capability-region-api__block">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function CapabilityPage({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { $t } = useBiuI18n();
  const localizedTitle = typeof title === "string" ? $t(title) : title;
  const localizedDescription = typeof description === "string" ? $t(description) : description;
  const localizedActions = actions ? <LocalizedDemoTree node={actions} $t={$t} /> : actions;
  return (
    <main className="biu-capability-page">
      <PageBox title={localizedTitle} description={localizedDescription} actions={localizedActions}>
        <LocalizedDemoTree node={children} $t={$t} />
      </PageBox>
    </main>
  );
}

export const CapabilityCard = forwardRef<
  HTMLElement,
  {
    id?: string;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    plain?: boolean;
    className?: string;
  }
>(function CapabilityCard({ id, title, description, children, plain = false, className }, ref) {
  const { $t } = useBiuI18n();
  const localizedTitle = typeof title === "string" ? $t(title) : title;
  const localizedDescription = typeof description === "string" ? $t(description) : description;
  return (
    <section
      ref={ref}
      id={id}
      className={["biu-capability-card", plain && "biu-capability-card--plain", className].filter(Boolean).join(" ")}
    >
      <h2>{localizedTitle}</h2>
      {localizedDescription ? <p className="biu-capability-card__description">{localizedDescription}</p> : null}
      {children}
    </section>
  );
});

CapabilityCard.displayName = "CapabilityCard";

export function CapabilityGrid({ children }: { children: ReactNode }) {
  return (
    <Grid columns={1} gap={16}>
      {children}
    </Grid>
  );
}

export function CapabilityActions({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Stack align="center" gap={8} wrap="wrap" style={style}>
      {children}
    </Stack>
  );
}
