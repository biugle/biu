import { regionRows } from "./mock.js";
import { splitString } from "@biugle/react-components";

export function queryRegionRows(keyword: string, channel: string) {
  const keywords = splitString(keyword, false, true).map((value) => value.toLowerCase());
  return regionRows.filter((row) => {
    if (channel !== "all" && row.channel !== channel) return false;
    return (
      keywords.length === 0 ||
      keywords.some((keyword) =>
        [row.region, row.channel, row.manager].some((value) => value.toLowerCase().includes(keyword)),
      )
    );
  });
}

export type { RegionRow } from "./mock.js";
