import type { Dayjs } from "dayjs";
export type Row = { id: number; name: string; owner: string; status: string; version: string };
export type QueryRow = { id: number; name: string; category: string; state: string };
export type QueryMode = "standard" | "legacy" | "error";
export type EditableDemoRow = {
  id: number;
  name: string;
  status: string;
  budget: number;
  note: string;
  date: Dayjs | null;
  time: Dayjs | null;
};
