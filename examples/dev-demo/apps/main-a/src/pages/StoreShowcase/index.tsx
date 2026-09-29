import { createBiuStore, createBiuTabStore } from "@biugle/biu-store";
import { Button, Tag, TextField } from "@biugle/react-components";
import {
  CapabilityApiTable,
  CapabilityActions,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
} from "../CapabilityPage/index.js";

const standardStore = createBiuStore({
  name: "demo-standard-store",
  initialState: { count: 0, keyword: "" },
  actions: ({ set, reset }) => ({
    increment: () => set((state) => ({ count: state.count + 1 })),
    setKeyword: (keyword: string) => set({ keyword }),
    reset,
  }),
});

const tabStore = createBiuTabStore({
  name: "demo-tab-store",
  tabs: ["all", "pending"] as const,
  initialParams: (tab) => ({ keyword: tab }),
});

export default function StoreShowcase() {
  const state = standardStore();
  const tabState = tabStore();
  return (
    <CapabilityPage
      className="biu-service-showcase-page"
      title="Store 能力展示"
      description="@biugle/biu-store 提供 Zustand 标准封装、重置、持久化脱敏、按 Tab 隔离查询参数和订阅入口。"
    >
      <CapabilityGrid>
        <CapabilityCard title="createBiuStore" description="标准状态、actions、reset 和 selector 使用方式。">
          <CapabilityActions>
            <Button type="primary" onClick={() => standardStore.getState().increment()}>
              increment
            </Button>
            <Button type="secondary" onClick={() => standardStore.getState().reset()}>
              reset
            </Button>
            <Tag color="success">count: {state.count}</Tag>
          </CapabilityActions>
          <TextField
            value={state.keyword}
            onChange={(event) => standardStore.getState().setKeyword(event.target.value)}
            placeholder="业务查询关键字"
            allowClear
            onClear={() => standardStore.getState().setKeyword("")}
          />
          <pre className="biu-capability-code">
            {JSON.stringify({ count: state.count, keyword: state.keyword }, null, 2)}
          </pre>
        </CapabilityCard>
        <CapabilityCard
          title="createBiuTabStore"
          description="每个标签页维护独立 queryParams、计数器和 activeTab，适合多 Tab 列表页。"
        >
          <CapabilityActions>
            <Button
              type={tabState.activeTab === "all" ? "primary" : "default"}
              size="small"
              onClick={() => tabStore.getState().setActiveTab("all")}
            >
              全部
            </Button>
            <Button
              type={tabState.activeTab === "pending" ? "primary" : "default"}
              size="small"
              onClick={() => tabStore.getState().setActiveTab("pending")}
            >
              待处理
            </Button>
            <Button
              type="secondary"
              size="small"
              onClick={() => tabStore.getState().patchTabParams({ keyword: `${tabState.activeTab}-changed` })}
            >
              patchTabParams
            </Button>
          </CapabilityActions>
          <pre className="biu-capability-code">
            {JSON.stringify(
              {
                activeTab: tabState.activeTab,
                queryParams: tabState.tabState[tabState.activeTab].queryParams,
                counters: tabState.counters,
              },
              null,
              2,
            )}
          </pre>
        </CapabilityCard>
        <CapabilityCard title="契约说明">
          <ul className="biu-capability-list">
            <li>Zustand 是唯一状态库，Runtime 只保留兼容导出。</li>
            <li>persist 默认进行 token/password/secret/cookie/session 脱敏。</li>
            <li>业务页面可直接使用 hook、getState、setState 和 subscribe。</li>
          </ul>
        </CapabilityCard>
      </CapabilityGrid>
      <CapabilityCard
        title="Store 属性与方法"
        description="标准 Zustand 工厂和多 Tab 页面工厂的核心契约；业务页可直接复用 hook、getState 和 subscribe。"
      >
        <CapabilityApiTable
          rows={[
            {
              component: "createBiuStore",
              name: "name / initialState",
              type: "string / State",
              defaultValue: "-",
              description: "定义稳定 store 名称和初始状态，方便持久化与调试。",
              demo: "count / keyword",
            },
            {
              component: "createBiuStore",
              name: "actions",
              type: "({ set, get, reset }) => Actions",
              defaultValue: "-",
              description: "集中定义业务动作，支持函数式 set 和统一 reset。",
              demo: "increment / setKeyword",
            },
            {
              component: "BiuStore",
              name: "hook / getState / setState",
              type: "selector-aware Zustand API",
              defaultValue: "-",
              description: "React 页面和非 React 工具都能访问同一状态入口。",
              demo: "按钮与输入框",
            },
            {
              component: "createBiuTabStore",
              name: "tabs / initialParams",
              type: "readonly string[] / (tab) => Params",
              defaultValue: "-",
              description: "为每个 Tab 隔离 queryParams、计数器和 activeTab。",
              demo: "全部 / 待处理",
            },
            {
              component: "BiuTabStore",
              name: "setActiveTab / patchTabParams",
              type: "(tab) / (params) => void",
              defaultValue: "-",
              description: "切换标签并局部更新当前列表查询参数。",
              demo: "patchTabParams",
            },
            {
              component: "BiuStore",
              name: "persist / subscribe",
              type: "storage options / listener",
              defaultValue: "脱敏持久化",
              description: "持久化默认过滤 token、password、secret、cookie 和 session。",
              demo: "契约说明",
            },
          ]}
        />
      </CapabilityCard>
    </CapabilityPage>
  );
}
