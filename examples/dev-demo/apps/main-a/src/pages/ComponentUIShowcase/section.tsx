import { type ReactNode } from "react";
import { useBiuI18n } from "@biugle/biu-runtime";
import { CapabilityCard, CapabilityApiTable, LocalizedDemoTree } from "../CapabilityPage/index.js";
import { sectionApiRows } from "./api/index.js";

export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  const { $t } = useBiuI18n();
  const apiRows = sectionApiRows[id] ?? [];
  return (
    <CapabilityCard id={id} title={title} description={description}>
      <LocalizedDemoTree node={children} $t={$t} />
      {apiRows.length ? (
        <div className="biu-capability-section-api">
          <h3>{$t("属性与方法")}</h3>
          <CapabilityApiTable rows={apiRows} />
        </div>
      ) : null}
    </CapabilityCard>
  );
}
