import { Button, Stack, Typography } from "@biugle/react-components";
import { useBiuI18n } from "@biugle/biu-runtime";

export function DirectionSwitch({
  value,
  onChange,
}: {
  value: "ltr" | "rtl";
  onChange: (direction: "ltr" | "rtl") => void;
}) {
  const { $t } = useBiuI18n();
  return (
    <Stack align="center" gap={6} wrap="wrap" role="group" aria-label={$t("文本方向")}>
      <Typography muted>{$t("演示方向")}</Typography>
      <Button
        type={value === "ltr" ? "primary" : "secondary"}
        variant="outlined"
        size="small"
        aria-pressed={value === "ltr"}
        onClick={() => onChange("ltr")}
      >
        LTR
      </Button>
      <Button
        type={value === "rtl" ? "primary" : "secondary"}
        variant="outlined"
        size="small"
        aria-pressed={value === "rtl"}
        onClick={() => onChange("rtl")}
      >
        RTL
      </Button>
    </Stack>
  );
}
