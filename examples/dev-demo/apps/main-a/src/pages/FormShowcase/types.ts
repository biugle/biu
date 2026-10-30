export interface FormValues {
  name: string;
  email: string;
  department: string;
  amount: number | string;
  formattedAmount: number | string;
  numericText: string;
  letterText: string;
  alphanumericText: string;
  customCode: string;
  note: string;
  needsApproval: boolean;
  volume: number;
  brightness: number;
  temperatureRange: [number, number];
  approver: string;
  date: unknown;
  rangeDate: unknown;
  time: unknown;
  rangeTime: unknown;
  notify: boolean;
  channel: string;
  cardNumber: string;
  contacts: Array<{ value: string; role: string; enabled: boolean }>;
}
