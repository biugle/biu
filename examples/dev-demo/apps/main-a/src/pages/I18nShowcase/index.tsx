import { useMemo, useState } from "react";
import { Button, Tag } from "@biugle/react-components";
import { createI18n, getBrowserLocale, normalizeBiuLocale } from "@biugle/biu-i18n";
import {
  CapabilityApiTable,
  CapabilityActions,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
} from "../CapabilityPage/index.js";

export default function I18nShowcase() {
  const messages = useMemo(
    () =>
      createI18n("zh-CN", {
        resources: {
          "zh-CN": { key: "zh-CN", desc: "中文", translation: { 问候: "你好，{name}" } },
          "en-US": { key: "en-US", desc: "English", translation: { 问候: "Hello, {name}" } },
        },
      }),
    [],
  );
  const [locale, setLocale] = useState(messages.getLocale());
  const switchLocale = (next: "zh-CN" | "en-US") => {
    messages.setLocale(next);
    setLocale(messages.getLocale());
  };
  return (
    <CapabilityPage
      className="biu-service-showcase-page"
      title="i18n 能力展示"
      description="locale 归一化、运行时切换、插值和目标语言缺失回退由 @biugle/biu-i18n 提供。"
    >
      <CapabilityGrid>
        <CapabilityCard
          title="方法清单"
          description="i18n 是 framework-neutral 功能包，负责资源、归一化、插值、回退、运行时切换和订阅。"
        >
          <ul className="biu-capability-list">
            <li>createI18n：创建独立实例，可配置 defaultLocale、fallbackLocale、storageKey。</li>
            <li>setLocale / getLocale / getLocaleList：运行时语言管理。</li>
            <li>$t / has / getResource / getTranslations：读取翻译、检测 key 和资源。</li>
            <li>addLocale / removeLocale / subscribe：动态资源和响应式切换。</li>
            <li>normalizeBiuLocale / getBrowserLocale：非法值安全回退到中文。</li>
          </ul>
          <pre className="biu-capability-code">
            {JSON.stringify(
              {
                normalized: normalizeBiuLocale("en"),
                browser: getBrowserLocale(),
                hasGreeting: messages.has("问候"),
                translations: messages.getTranslations(locale),
              },
              null,
              2,
            )}
          </pre>
        </CapabilityCard>
        <CapabilityCard title="运行时切换">
          <CapabilityActions>
            <Button size="small" onClick={() => switchLocale("zh-CN")}>
              中文
            </Button>
            <Button size="small" variant="secondary" onClick={() => switchLocale("en-US")}>
              English
            </Button>
            <Tag color="info">{locale}</Tag>
          </CapabilityActions>
          <p>{messages.$t("问候", { name: "Biu" })}</p>
          <p>缺失 key：{messages.$t("不存在的文案")}</p>
        </CapabilityCard>
        <CapabilityCard title="资源列表">
          <ul className="biu-capability-list">
            {messages.getLocaleList().map((item) => (
              <li key={item.code}>
                {item.code} · {item.label}
              </li>
            ))}
          </ul>
          <p>业务页面使用 Runtime 的 useBiuI18n；非 Hook 代码使用稳定的 i18n.$t。</p>
        </CapabilityCard>
      </CapabilityGrid>
      <CapabilityCard
        title="i18n 属性与方法"
        description="资源、归一化、回退、插值、动态资源和订阅都是 framework-neutral API。"
      >
        <CapabilityApiTable
          rows={[
            {
              component: "createI18n",
              name: "defaultLocale / fallbackLocale",
              type: "BiuLocale / BiuLocale",
              defaultValue: "zh-CN / zh-CN",
              description: "创建实例并定义默认语言与缺失 key 的回退顺序。",
              demo: "中文 / English",
            },
            {
              component: "I18n",
              name: "$t",
              type: "(key, params?) => string",
              defaultValue: "key",
              description: "读取翻译并支持 {name} 插值，缺失时回退到目标资源、英文、中文和 key。",
              demo: "问候",
            },
            {
              component: "I18n",
              name: "setLocale / getLocale",
              type: "(locale) / () => locale",
              defaultValue: "zh-CN",
              description: "运行时切换并读取已归一化语言值。",
              demo: "中文 / English 按钮",
            },
            {
              component: "I18n",
              name: "addLocale / removeLocale",
              type: "(locale, resource) / (locale) => void",
              defaultValue: "-",
              description: "动态加载或移除语言资源，适合按业务模块拆包。",
              demo: "资源列表",
            },
            {
              component: "I18n",
              name: "has / getResource / getTranslations",
              type: "(key) / (locale) / (locale)",
              defaultValue: "-",
              description: "检测 key 并读取单语言或完整翻译资源。",
              demo: "JSON 预览",
            },
            {
              component: "I18n",
              name: "subscribe / normalizeBiuLocale",
              type: "listener / (value) => locale",
              defaultValue: "- / zh-CN",
              description: "监听语言切换并保证非法配置不会进入选择器。",
              demo: "运行时切换",
            },
          ]}
        />
      </CapabilityCard>
    </CapabilityPage>
  );
}
