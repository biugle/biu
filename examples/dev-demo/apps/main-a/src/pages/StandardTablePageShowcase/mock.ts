export interface RegionRow {
  id: number;
  region: string;
  regionCode: string;
  channel: string;
  manager: string;
  quota: number;
  progress: number;
  updatedAt: string;
  source: string;
  segment: string;
  tier: string;
  population: number;
  coverage: number;
  risk: string;
  lastAudit: string;
  contact: string;
  status: string;
  score: number;
  cycle: string;
  note: string;
}

const regionNames = ["北岸片区", "云港片区", "新桥片区", "南岭片区", "晨光片区", "远洲片区"];
const channelNames = ["直营", "合作", "线上", "服务商"];
const managerNames = ["唐宁", "沈禾", "顾言", "苏澄", "林简"];

export const regionRows: RegionRow[] = Array.from({ length: 110 }, (_, index) => ({
  id: index + 1,
  region: regionNames[index % regionNames.length],
  regionCode: `RG-${String(index + 1).padStart(4, "0")}`,
  channel: channelNames[index % channelNames.length],
  manager: managerNames[index % managerNames.length],
  quota: 5000 + index * 720,
  progress: 38 + ((index * 11) % 59),
  updatedAt: `2026-08-${String((index % 27) + 1).padStart(2, "0")}`,
  source: index % 2 === 0 ? "日常同步" : "人工录入",
  segment: index % 3 === 0 ? "重点区域" : index % 3 === 1 ? "成长区域" : "常规区域",
  tier: index % 3 === 0 ? "核心" : index % 3 === 1 ? "成长" : "标准",
  population: 12_000 + index * 185,
  coverage: 62 + ((index * 7) % 37),
  risk: index % 4 === 0 ? "需关注" : "正常",
  lastAudit: `2026-07-${String((index % 25) + 1).padStart(2, "0")}`,
  contact: ["400-801-2201", "400-801-2202", "400-801-2203"][index % 3],
  status: index % 5 === 0 ? "待复核" : "已生效",
  score: 72 + ((index * 5) % 27),
  cycle: index % 2 === 0 ? "月度" : "季度",
  note: index % 3 === 0 ? "重点跟进" : "常规维护",
}));
