import { useEffect, useRef, useState } from "react";
import { createWatermark } from "@biugle/watermark";
import { Button, InputNumber, TextField, Tag } from "@biugle/react-components";
import {
  CapabilityActions,
  CapabilityApiTable,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
} from "../CapabilityPage/index.js";

export default function WatermarkShowcase() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState("Biu 内部系统");
  const [color, setColor] = useState("#64748b");
  const [opacity, setOpacity] = useState(0.14);
  const [rotate, setRotate] = useState(-22);

  useEffect(() => {
    if (!stageRef.current || !enabled) return;
    const handle = createWatermark(stageRef.current, {
      text: [text, "仅供演示"],
      color,
      opacity,
      rotate,
      gap: [120, 88],
    });
    return handle.destroy;
  }, [color, enabled, opacity, rotate, text]);

  return (
    <CapabilityPage
      className="biu-service-showcase-page"
      title="Watermark 能力展示"
      description="@biugle/watermark 是框架无关的 DOM 水印包；官方 Layout 通过 layout.watermark 复用同一实现。"
      actions={<Tag color={enabled ? "success" : "warning"}>{enabled ? "已启用" : "已关闭"}</Tag>}
    >
      <CapabilityGrid>
        <CapabilityCard title="实时预览" description="水印不拦截点击，支持多行文案、颜色、透明度和旋转角度。">
          <div ref={stageRef} className="biu-capability-watermark-stage">
            <strong>可交互内容区域</strong>
            <p>这里模拟业务页面内容。关闭水印后，布局和内容本身不发生变化。</p>
            <Button type="secondary" size="small" onClick={() => setEnabled((current) => !current)}>
              {enabled ? "关闭水印" : "开启水印"}
            </Button>
          </div>
        </CapabilityCard>

        <CapabilityCard title="水印参数">
          <div className="biu-capability-control-row">
            <TextField value={text} onChange={(event) => setText(event.target.value)} addonBefore="文案" />
            <label>
              颜色
              <TextField
                type="color"
                className="biu-watermark-color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                aria-label="水印颜色"
              />
            </label>
            <label>
              透明度
              <InputNumber
                className="biu-watermark-number"
                min={0.04}
                max={0.4}
                step={0.01}
                decimal={2}
                value={opacity}
                onChange={(value) => setOpacity(Number(value ?? 0.14))}
                aria-label="水印透明度"
              />
            </label>
            <label>
              旋转
              <InputNumber
                className="biu-watermark-number"
                min={-45}
                max={45}
                step={1}
                decimal={0}
                value={rotate}
                onChange={(value) => setRotate(Number(value ?? -22))}
                aria-label="水印旋转角度"
              />
              <span>°</span>
            </label>
          </div>
          <CapabilityActions>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setText("Biu 内部系统");
                setColor("#64748b");
                setOpacity(0.14);
                setRotate(-22);
              }}
            >
              恢复默认
            </Button>
          </CapabilityActions>
        </CapabilityCard>

        <CapabilityCard title="官方基座配置">
          <pre className="biu-capability-code">{`layout: {\n  preset: "sidebar",\n  watermark: {\n    enabled: true,\n    text: ["Biu", "内部系统"],\n    opacity: 0.12,\n    rotate: -20,\n  },\n}`}</pre>
          <ul className="biu-capability-list">
            <li>省略 text 时，官方 Layout 默认使用 brandLabel/appLabel。</li>
            <li>enabled: false 会移除水印层，不改变基座骨架。</li>
            <li>自定义 className、CSS variables 和 DOM target 可由业务继续扩展。</li>
          </ul>
        </CapabilityCard>
      </CapabilityGrid>
      <CapabilityCard
        title="Watermark 属性与方法"
        description="水印通过原生 DOM/SVG 绘制，Preset 和业务页面都复用同一生命周期；Logger 只通过回调通知刷新。"
      >
        <CapabilityApiTable
          rows={[
            {
              component: "createWatermark",
              name: "target / text / color / opacity",
              type: "HTMLElement / string | string[] / string / number",
              defaultValue: "text=[] / color=#64748b / opacity=0.14",
              description: "在指定 DOM 容器创建重复 SVG 水印，支持多行文案、颜色和透明度。",
              demo: "实时预览",
            },
            {
              component: "WatermarkOptions",
              name: "fontSize / fontFamily / rotate / gap / offset",
              type: "number / string / number / [number, number]",
              defaultValue: "组件安全默认值",
              description: "控制字体、旋转、重复间距和偏移；可继续通过 className 与 CSS 变量扩展。",
              demo: "水印参数",
            },
            {
              component: "WatermarkOptions",
              name: "observeTamper / refreshThrottleMs",
              type: "boolean / number",
              defaultValue: "false / 1200",
              description: "可选观察水印层被移除或改写，并用节流刷新避免 Observer 回环和性能抖动。",
              demo: "篡改恢复边界",
            },
            {
              component: "WatermarkHandle",
              name: "update / refresh / destroy",
              type: "(options) / () / ()",
              defaultValue: "-",
              description: "运行时更新、主动刷新和销毁；destroy 会恢复容器原始定位样式。",
              demo: "开启/关闭水印",
            },
            {
              component: "Logger 联动",
              name: "onConsoleOpen / onWatermarkRefresh",
              type: "callback / callback",
              defaultValue: "undefined",
              description:
                "Logger 不依赖 Watermark；业务可在检测到 Console 后调用 handle.refresh()，且回调由 Logger 节流。",
              demo: "Logger 能力页代码",
            },
          ]}
        />
      </CapabilityCard>
    </CapabilityPage>
  );
}
