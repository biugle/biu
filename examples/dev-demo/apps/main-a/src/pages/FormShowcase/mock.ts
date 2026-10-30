import type { FormValues } from "./types.js";
export function createDefaultFormValues(): FormValues {
  return {
    name: "",
    email: "",
    department: "platform",
    amount: 128.5,
    formattedAmount: 1234567.89,
    numericText: "2026",
    letterText: "Biu",
    alphanumericText: "Biu2026",
    customCode: "BIU-2026",
    note: "",
    needsApproval: false,
    volume: 68,
    brightness: 70,
    temperatureRange: [12, 28],
    approver: "",
    date: null,
    rangeDate: [null, null],
    time: null,
    rangeTime: [null, null],
    notify: true,
    channel: "browser",
    cardNumber: "6222-123-ABCD",
    contacts: [{ value: "项目负责人", role: "产品负责人", enabled: true }],
  };
}
