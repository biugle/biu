import { useEffect, useState } from "react";
import { Button, Result, Tag } from "@biugle/react-components";
import { CopyButton, useBiuContext, useBiuI18n, useBiuPermission } from "@biugle/biu-runtime";
import { CapabilityActions, CapabilityCard, CapabilityGrid, CapabilityPage } from "../CapabilityPage/index.js";

export default function RuntimeCapabilities() {
  const context = useBiuContext();
  const { $t, locale } = useBiuI18n();
  const permitted = useBiuPermission("demo.runtime");
  const [events, setEvents] = useState<string[]>([]);
  const [result, setResult] = useState("等待 Runtime 事件");
  useEffect(
    () =>
      context.events.subscribe("demo:runtime", (event) =>
        setEvents((current) =>
          [`${event.source || "unknown"}: ${JSON.stringify(event.payload)}`, ...current].slice(0, 6),
        ),
      ),
    [context.events],
  );
  const publish = () => {
    context.events.publish("demo:runtime", { locale, timestamp: new Date().toISOString() }, context.appId);
    setResult($t("事件已发布"));
  };
  const errorDetails = `appId=${context.appId}\nlocale=${locale}\npermission=${permitted}`;
  return (
    <CapabilityPage
      title="Runtime 能力展示"
      description="验证 useBiuContext、i18n、权限判断、类型化事件和错误详情复制。"
    >
      <CapabilityGrid>
        <CapabilityCard title="Runtime API 状态">
          <ul className="biu-capability-list">
            <li>navigate / navigateByCode / navigateByKey</li>
            <li>login / logout / refreshAuth</li>
            <li>setLayoutOverrides / resetLayoutOverrides</li>
            <li>events.publish / events.subscribe</li>
          </ul>
          <div className="biu-capability-actions" style={{ marginTop: 12 }}>
            <Tag color={permitted ? "success" : "warning"}>
              {permitted ? "permission: allowed" : "permission: denied"}
            </Tag>
          </div>
        </CapabilityCard>
        <CapabilityCard title="事件总线">
          <CapabilityActions>
            <Button size="small" onClick={publish}>
              发布事件
            </Button>
            <Button size="small" variant="secondary" onClick={() => setEvents([])}>
              清空记录
            </Button>
          </CapabilityActions>
          <Result status="info" title={result} />
          <ul className="biu-capability-list">
            {events.length ? (
              events.map((event, index) => <li key={`${event}-${index}`}>{event}</li>)
            ) : (
              <li>暂无事件</li>
            )}
          </ul>
        </CapabilityCard>
        <CapabilityCard title="框架无关 i18n">
          <p>{$t("欢迎使用 {app}", { app: "Biu Runtime" })}</p>
          <p>locale: {locale}</p>
          <CopyButton value={errorDetails} locale={locale} />
        </CapabilityCard>
      </CapabilityGrid>
    </CapabilityPage>
  );
}
