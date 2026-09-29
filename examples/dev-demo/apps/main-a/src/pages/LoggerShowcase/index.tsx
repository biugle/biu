import { useEffect, useMemo, useState } from "react";
import { createLogger, type BiuLogType, type ConsoleOpenEvent } from "@biugle/logger";
import { Button, Tag, TextField } from "@biugle/react-components";
import {
  CapabilityActions,
  CapabilityApiTable,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
} from "../CapabilityPage/index.js";

const logTypes: BiuLogType[] = ["default", "primary", "success", "warning", "error"];

const apiRows = [
  {
    component: "createLogger",
    name: "options",
    type: "BiuLoggerOptions",
    defaultValue: "{}",
    description: "创建原生 JS 日志实例，可配置前缀、console guard、检测和水印回调。",
    demo: "本页实例",
  },
  {
    component: "Logger",
    name: "log(type, ...data)",
    type: "BiuLogType + unknown[]",
    defaultValue: "-",
    description: "使用 default、primary、success、warning、error 颜色和稳定前缀输出多参数日志。",
    demo: "类型按钮",
  },
  {
    component: "Logger",
    name: "debug / info / success / warning / error / primary / default",
    type: "(...data) => void",
    defaultValue: "-",
    description: "常用语义方法；不改变原生 console 的多参数使用方式。",
    demo: "日志输出",
  },
  {
    component: "Logger",
    name: "start / stop",
    type: "() => void",
    defaultValue: "自动 start",
    description: "启动或停止 console guard、DevTools 探测和 debugger 定时器。",
    demo: "启动/停止",
  },
  {
    component: "Logger",
    name: "restoreConsole / destroy",
    type: "() => void",
    defaultValue: "-",
    description: "恢复被替换的 console 方法并清理 timer；destroy 可重复调用。",
    demo: "生命周期",
  },
  {
    component: "BiuLoggerOptions",
    name: "disableConsole",
    type: "boolean | ConsoleMethod[]",
    defaultValue: "false",
    description: "按需禁止全部或部分 console 方法，默认不修改全局 console。",
    demo: "安全配置",
  },
  {
    component: "BiuLoggerOptions",
    name: "detectConsoleOpen / onConsoleOpen",
    type: "boolean / (event) => void",
    defaultValue: "false / undefined",
    description: "最佳努力检测 DevTools；浏览器没有标准打开事件，回调携带 method 和 confidence。",
    demo: "检测回调",
  },
  {
    component: "BiuLoggerOptions",
    name: "onWatermarkRefresh / refreshThrottleMs",
    type: "() => void / number",
    defaultValue: "undefined / 1200",
    description: "检测到 console 后节流通知水印刷新，避免 observer/timer 高频重绘。",
    demo: "水印联动",
  },
];

export default function LoggerShowcase() {
  const [prefix, setPrefix] = useState("Demo");
  const [running, setRunning] = useState(true);
  const [lastLog, setLastLog] = useState("尚未输出日志");
  const [refreshCount, setRefreshCount] = useState(0);
  const [detection, setDetection] = useState<ConsoleOpenEvent>();
  const logger = useMemo(
    () =>
      createLogger({
        prefix,
        onConsoleOpen: setDetection,
        onWatermarkRefresh: () => setRefreshCount((value) => value + 1),
      }),
    [prefix],
  );

  useEffect(() => () => logger.destroy(), [logger]);

  const write = (type: BiuLogType) => {
    const message = `${type} 日志 · ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`;
    setLastLog(message);
    logger.log(type, message, { source: "LoggerShowcase" });
  };

  const toggleLifecycle = () => {
    if (running) {
      logger.stop();
      setRunning(false);
    } else {
      logger.start();
      setRunning(true);
    }
  };

  return (
    <CapabilityPage
      className="biu-service-showcase-page"
      title="Logger 能力展示"
      description="@biugle/logger 是框架无关的原生 JS 日志与 console guard 包，支持 React、Vue、HTML、iframe 和水印联动。"
    >
      <CapabilityGrid>
        <CapabilityCard
          title="彩色日志与多参数输出"
          description="点击按钮会真实调用 logger，并保留浏览器原生 console 的多参数能力。"
        >
          <div className="biu-capability-control-row">
            <TextField value={prefix} onChange={(event) => setPrefix(event.target.value)} addonBefore="前缀" />
            {logTypes.map((type) => (
              <Button key={type} type={type === "default" ? "default" : type} onClick={() => write(type)}>
                {type}
              </Button>
            ))}
          </div>
          <pre className="biu-capability-code">{lastLog}</pre>
        </CapabilityCard>

        <CapabilityCard
          title="生命周期与安全边界"
          description="默认不会禁止 console，也不会启动 debugger；高风险能力必须由业务显式配置。"
        >
          <CapabilityActions>
            <Button type={running ? "warning" : "success"} onClick={toggleLifecycle}>
              {running ? "停止 Logger" : "启动 Logger"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                logger.restoreConsole();
                setLastLog("已恢复被 Logger 接管的 console 方法");
              }}
            >
              恢复 Console
            </Button>
            <Tag color={running ? "success" : "warning"}>{running ? "运行中" : "已停止"}</Tag>
          </CapabilityActions>
          <ul className="biu-capability-list">
            <li>disableConsole 可传 true 或指定方法数组，destroy 会恢复原始方法。</li>
            <li>debuggerMode 默认 off；on-open 和 interval 都是显式 opt-in 且可停止。</li>
            <li>SSR/Node 环境安全降级，不访问 window/document 时仍可正常输出日志。</li>
          </ul>
        </CapabilityCard>

        <CapabilityCard
          title="Console 检测与 Watermark 联动"
          description="浏览器没有标准 DevTools 打开事件，检测只提供最佳努力信号并带节流。"
        >
          <div className="biu-capability-control-row">
            <Tag color="info">水印刷新回调：{refreshCount} 次</Tag>
            <Tag color={detection ? "success" : "default"}>
              {detection ? `最近检测：${detection.method} / ${detection.confidence}` : "尚未检测到 Console"}
            </Tag>
          </div>
          <pre className="biu-capability-code">{`createLogger({
  detectConsoleOpen: true,
  onConsoleOpen: (event) => watermark.refresh(),
  onWatermarkRefresh: () => watermark.refresh(),
  refreshThrottleMs: 1200,
})`}</pre>
        </CapabilityCard>

        <CapabilityCard title="Logger 属性与方法">
          <CapabilityApiTable rows={apiRows} />
        </CapabilityCard>
      </CapabilityGrid>
    </CapabilityPage>
  );
}
