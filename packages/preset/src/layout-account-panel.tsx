import { useEffect, useRef } from "react";
import { useBiuI18n, type BiuAccountPanelSubmit } from "@biugle/biu-runtime";
import { Dialog } from "@biugle/react-components";
import type { PresetContentProps } from "./layout-components.js";

interface LayoutAccountPanelProps extends Pick<PresetContentProps, "portalSlots"> {
  panel?: "PROFILE" | "PASSWORD";
  onClose: () => void;
}

export function LayoutAccountPanel({ panel, portalSlots, onClose }: LayoutAccountPanelProps) {
  const { $t } = useBiuI18n();
  const submitRef = useRef<BiuAccountPanelSubmit | undefined>(undefined);
  const content = panel === "PROFILE" ? portalSlots?.profilePanel : portalSlots?.passwordPanel;

  useEffect(() => {
    submitRef.current = undefined;
  }, [panel]);

  if (!panel || !content) return null;

  const close = () => {
    submitRef.current = undefined;
    onClose();
  };

  return (
    <Dialog
      open
      title={panel === "PROFILE" ? $t("个人信息") : $t("修改密码")}
      onOk={() => submitRef.current?.()}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      {typeof content === "function" ? content(close, (submit) => (submitRef.current = submit)) : content}
    </Dialog>
  );
}
