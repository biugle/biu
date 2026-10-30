import * as React from "react";
import { useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Dialog as UIDialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer as UIDrawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  RangeDatePicker,
  RangeTimePicker,
  Stack,
  TimePicker,
} from "@biugle/react-components/ui";
import { biuMessage } from "@biugle/react-components";
import { useBiuContext, useBiuI18n } from "@biugle/biu-runtime";
import { OverlayInteractionSections } from "../overlay-interaction-sections.js";
import { Section } from "../section.js";
import type { CatalogSectionProps } from "../catalog-types.js";

export function DateOverlaySections({ pro }: CatalogSectionProps) {
  const { $t } = useBiuI18n();
  const [time, setTime] = useState<React.ComponentProps<typeof TimePicker>["value"]>(dayjs("2026-09-01 09:09:09"));
  const { locale } = useBiuContext();
  const [date, setDate] = useState<React.ComponentProps<typeof DatePicker>["value"]>(dayjs("2026-09-01 09:09:09"));
  const [date12Hour, setDate12Hour] = useState<React.ComponentProps<typeof DatePicker>["value"]>(
    dayjs("2026-09-01 15:09:09"),
  );
  const [rangeDate, setRangeDate] = useState<React.ComponentProps<typeof RangeDatePicker>["value"]>([
    dayjs("2026-09-01 09:09:09"),
    dayjs("2026-09-30 18:30:00"),
  ]);
  const [time12Hour, setTime12Hour] = useState<React.ComponentProps<typeof TimePicker>["value"]>(
    dayjs("2026-09-01 15:09:09"),
  );
  const [rangeTime, setRangeTime] = useState<React.ComponentProps<typeof RangeTimePicker>["value"]>([
    dayjs("2026-09-01 09:09:00"),
    dayjs("2026-09-01 18:30:00"),
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <>
      <Section
        id="date-picker"
        title="日期选择器 DatePicker / RangeDatePicker"
        description="日期、时间、快捷项和清除均即时回传，选择后保持打开；可直接输入年份、选择月份，并提供 12 小时制日期时间案例。"
      >
        <Stack align={"center"} gap={10} wrap="wrap">
          <DatePicker value={date} onChange={setDate} locale={locale} format="YYYY-MM-DD" placeholder="YYYY-MM-DD" />
          <DatePicker
            value={date}
            onChange={setDate}
            locale={locale}
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="YYYY-MM-DD HH:mm:ss"
            showTime
            needConfirm={pro}
          />
          <DatePicker
            value={date12Hour}
            onChange={setDate12Hour}
            locale={locale}
            format="YYYY-MM-DD hh:mm A"
            placeholder="YYYY-MM-DD hh:mm A"
            showTime
            hour12
            needConfirm={pro}
          />
          <RangeDatePicker
            value={rangeDate}
            onChange={setRangeDate}
            locale={locale}
            format="YYYY-MM-DD"
            placeholder={["开始日期", "结束日期"]}
            needConfirm={pro}
          />
          <RangeDatePicker
            value={rangeDate}
            onChange={setRangeDate}
            locale={locale}
            format="YYYY-MM-DD HH:mm:ss"
            placeholder={["开始时间", "结束时间"]}
            showTime
            needConfirm={pro}
          />
        </Stack>
      </Section>
      <Section
        id="time-picker"
        title="时间选择器 TimePicker / RangeTimePicker"
        description="同时展示 24 小时制和 12 小时制；时间变化即时回传并保持面板打开，确认按钮只负责关闭。"
      >
        <Stack align={"center"} gap={10} wrap="wrap">
          <TimePicker
            value={time}
            onChange={setTime}
            locale={locale}
            format="HH:mm"
            placeholder="HH:mm"
            needConfirm={pro}
          />
          <TimePicker
            value={time}
            onChange={setTime}
            locale={locale}
            format="HH:mm:ss"
            placeholder="HH:mm:ss"
            hour12={false}
            needConfirm={pro}
          />
          <TimePicker
            value={time12Hour}
            onChange={setTime12Hour}
            locale={locale}
            format="hh:mm A"
            placeholder="hh:mm A"
            hour12
            needConfirm={pro}
          />
          <RangeTimePicker
            value={rangeTime}
            onChange={setRangeTime}
            locale={locale}
            format="HH:mm:ss"
            needConfirm={pro}
          />
        </Stack>
      </Section>
      <Section
        id="dialog"
        title="对话框 Dialog"
        description="UI Dialog 只提供可组合结构；默认可按住 header 非交互区域在浏览器视口内拖动，初始位置由 position 和 offset 决定；也支持 fullscreen、destroyOnClose、container 和 classNames。"
      >
        <Button type="primary" onClick={() => setDialogOpen(true)}>
          打开 Dialog
        </Button>
        <UIDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          position={pro ? "top" : "center"}
          offsetTop={pro ? 72 : undefined}
          destroyOnClose
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>可组合 Dialog</DialogTitle>
              <DialogClose aria-label="关闭" />
            </DialogHeader>
            <DialogBody>
              <p>内容、按钮和表单由业务自由组合，焦点、ESC、遮罩和 Portal 由组件处理。</p>
            </DialogBody>
            <DialogFooter>
              <Button type="secondary" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setDialogOpen(false);
                  biuMessage.success($t("已完成"));
                }}
              >
                确定
              </Button>
            </DialogFooter>
          </DialogContent>
        </UIDialog>
      </Section>
      <Section
        id="drawer"
        title="抽屉 Drawer"
        description="四方向占满对应 viewport 边缘，支持 size、fullscreen 和可组合头部/底部。"
      >
        <Button type="secondary" onClick={() => setDrawerOpen(true)}>
          打开 Drawer
        </Button>
        <UIDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          placement={pro ? "left" : "right"}
          size={pro ? 520 : 380}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>可组合 Drawer</DrawerTitle>
              <DrawerClose aria-label="关闭" />
            </DrawerHeader>
            <DrawerBody>
              <p>Drawer 内容区域可滚动，面板保持对应方向完整高度。</p>
            </DrawerBody>
            <DrawerFooter>
              <Button type="secondary" onClick={() => setDrawerOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setDrawerOpen(false)}>确定</Button>
            </DrawerFooter>
          </DrawerContent>
        </UIDrawer>
      </Section>
      <OverlayInteractionSections pro={pro} renderSection={(props) => <Section {...props} />} />
    </>
  );
}
