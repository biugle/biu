import { useState } from "react";
import {
  Checkbox,
  CheckboxGroup,
  Grid,
  RadioGroup,
  Stack,
  Slider,
  Switch,
  Textarea,
  TextField,
} from "@biugle/react-components/ui";
import { ProTextFieldDemo } from "../pro-textfield.js";
import { InputNumberShowcaseSection } from "../input-number-showcase.js";
import { Section } from "../section.js";
import type { CatalogSectionProps } from "../catalog-types.js";

export function InputSections({ pro }: CatalogSectionProps) {
  const [text, setText] = useState("组件库");
  const [numberText, setNumberText] = useState("2026");
  const [letterText, setLetterText] = useState("Biu");
  const [alphanumericText, setAlphanumericText] = useState("Biu2026");
  const [customPatternText, setCustomPatternText] = useState("BIU-2026");
  const [checks, setChecks] = useState(["ui"]);
  const [radio, setRadio] = useState("react");
  const [switched, setSwitched] = useState(false);
  const [weatherRange, setWeatherRange] = useState<[number, number]>([12, 28]);
  const [volume, setVolume] = useState(68);
  const [brightness, setBrightness] = useState(70);
  const [rating, setRating] = useState(4);
  const [sliderOpacity, setSliderOpacity] = useState(0.75);
  return (
    <>
      <Section
        id="textfield-textarea"
        title="文本框 TextField / Textarea"
        description="筛选区和 Form.Item 均可直接组合；支持输入规则、正则过滤、清除、计数、前后缀和原生 inputProps。"
      >
        <Stack direction="column" gap={14}>
          <div className="biu-capability-demo-block">
            <strong>基础输入、搜索和文本域</strong>
            <Grid columns={3} gap={10} style={{ alignItems: "start" }}>
              <TextField
                value={text}
                onChange={(event) => setText(event.target.value)}
                allowClear
                onClear={() => setText("")}
                showCount
                maxLength={20}
                addonBefore="关键字"
                placeholder="请输入"
                aria-label="基础文本"
              />
              <TextField
                type="search"
                placeholder="筛选条件"
                inputProps={{ autoComplete: "off" }}
                aria-label="搜索文本"
              />
              <Textarea placeholder="备注信息" showCount maxLength={80} rows={3} aria-label="备注文本" />
            </Grid>
          </div>
          <div className="biu-capability-demo-block">
            <strong>内置输入规则：纯数字、纯字母、字母数字</strong>
            <Grid columns={3} gap={10} style={{ alignItems: "start" }}>
              <div>
                <TextField
                  value={numberText}
                  inputRule="number"
                  onChange={(event) => setNumberText(event.target.value)}
                  placeholder="仅允许数字"
                  aria-label="纯数字文本"
                />
                <span>实际值：{numberText || "（空）"}</span>
              </div>
              <div>
                <TextField
                  value={letterText}
                  inputRule="letter"
                  onChange={(event) => setLetterText(event.target.value)}
                  placeholder="仅允许英文字母"
                  aria-label="纯字母文本"
                />
                <span>实际值：{letterText || "（空）"}</span>
              </div>
              <div>
                <TextField
                  value={alphanumericText}
                  inputRule="alphanumeric"
                  onChange={(event) => setAlphanumericText(event.target.value)}
                  placeholder="允许字母和数字"
                  aria-label="字母数字文本"
                />
                <span>实际值：{alphanumericText || "（空）"}</span>
              </div>
            </Grid>
          </div>
          <div className="biu-capability-demo-block">
            <strong>自定义正则输入：大写字母、数字和短横线</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <TextField
                value={customPatternText}
                inputPattern={/^[A-Z0-9-]*$/}
                onChange={(event) => setCustomPatternText(event.target.value)}
                placeholder="例如 BIU-2026"
                aria-label="自定义正则文本"
              />
              <span>实际值：{customPatternText || "（空）"}</span>
            </Stack>
          </div>
        </Stack>
      </Section>
      <Section
        id="pro-textfield"
        title="批量文本 ProTextField"
        description="换行、空白和中英文逗号可组合分隔；支持草稿确认、取消、清空及筛选区组合。"
      >
        <ProTextFieldDemo />
      </Section>
      <InputNumberShowcaseSection />
      <Section
        id="checkbox"
        title="复选框 Checkbox / CheckboxGroup"
        description="受控和非受控联动，onChange 返回最新值，选项可独立禁用。"
      >
        <Checkbox
          label="独立 Checkbox"
          checked={checks.includes("standalone")}
          onChange={(event) =>
            setChecks((current) =>
              event.currentTarget.checked
                ? [...current, "standalone"]
                : current.filter((value) => value !== "standalone"),
            )
          }
        />
        <CheckboxGroup
          options={[
            { label: "UI", value: "ui" },
            { label: "Pro", value: "pro" },
            { label: "Query", value: "query" },
          ]}
          value={checks}
          direction={pro ? "vertical" : "horizontal"}
          optionRender={pro ? (option) => <span>{option.label}（可自定义）</span> : undefined}
          onChange={setChecks}
        />
        <p>已选择：{checks.join("、") || "无"}</p>
      </Section>
      <Section id="radio" title="单选框 Radio / RadioGroup" description="标准表单联动、name 隔离和禁用项。">
        <RadioGroup
          name="showcase-entry"
          options={[
            { label: "React", value: "react" },
            { label: "Vue", value: "vue" },
            { label: "HTML", value: "html" },
          ]}
          value={radio}
          direction={pro ? "vertical" : "horizontal"}
          optionRender={pro ? (option) => <span>{option.label} 入口</span> : undefined}
          onChange={setRadio}
        />
        <p>当前入口：{radio}</p>
      </Section>
      <Section
        id="switch"
        title="开关 Switch"
        description="支持受控、loading、只读和受控联动；开关本体保持纯胶囊轨道，不在内部显示文字。"
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Switch checked={switched} onChange={setSwitched} aria-label="开关" />
          <span>{switched ? "已开启" : "已关闭"}</span>
        </span>
      </Section>
      <Section
        id="slider"
        title="滑块 Slider"
        description="用于连续数值、范围和分档数值选择；支持键盘、点击轨道、刻度、范围双滑块、垂直方向和数值 Tooltip。"
      >
        <Stack direction="column" gap={14}>
          <div className="biu-capability-demo-block">
            <strong>天气范围</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <Slider
                range
                min={-20}
                max={45}
                step={1}
                value={weatherRange}
                marks={{ [-20]: "-20℃", 0: "0℃", 20: "20℃", 45: "45℃" }}
                tooltip="always"
                onChange={(next) => setWeatherRange(next as [number, number])}
                aria-label="天气温度范围"
              />
            </Stack>
            <span>
              可接受温度：{weatherRange[0]}℃ 至 {weatherRange[1]}℃
            </span>
          </div>
          <div className="biu-capability-demo-block">
            <strong>音量</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <Slider
                value={volume}
                onChange={(next) => setVolume(next as number)}
                tooltip="always"
                aria-label="音量"
              />
            </Stack>
            <span>当前音量：{volume}%</span>
          </div>
          <div className="biu-capability-demo-block">
            <strong>亮度与步进</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <Slider
                value={brightness}
                min={0}
                max={100}
                step={10}
                dots
                tooltip="hover"
                onChange={(next) => setBrightness(next as number)}
                aria-label="屏幕亮度"
              />
            </Stack>
            <span>当前亮度：{brightness}%（每次调整 10%）</span>
          </div>
          <div className="biu-capability-demo-block biu-slider-rating-demo">
            <strong>评分设置</strong>
            <Slider
              value={rating}
              min={0}
              max={5}
              step={0.5}
              marks={{ 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5" }}
              tooltip="always"
              onChange={(next) => setRating(next as number)}
              aria-label="评分"
            />
            <span>当前评分：{rating} 分</span>
          </div>
          <div className="biu-capability-demo-block">
            <strong>透明度</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <Slider
                value={sliderOpacity}
                min={0.2}
                max={1}
                step={0.05}
                opacity={sliderOpacity}
                tooltip="always"
                aria-label="滑块透明度"
                onChange={(next) => setSliderOpacity(next as number)}
              />
            </Stack>
            <span>当前透明度：{Math.round(sliderOpacity * 100)}%</span>
          </div>
        </Stack>
      </Section>
    </>
  );
}
