import * as React from "react";

export function useCatalogOptions(pro: boolean) {
  const options = React.useMemo(
    () => [
      { label: "平台工程与基础架构团队", value: "platform" },
      { label: "业务研发与数据应用团队", value: "product" },
      { label: "体验设计与设计系统团队", value: "design", disabled: pro },
      { label: "质量保障与自动化验证中心", value: "quality" },
      { label: "运营协同与客户成功支持中心", value: "operations" },
      { label: "超长选项：跨区域数据治理与服务编排联合工作组", value: "governance" },
    ],
    [pro],
  );
  return options;
}
