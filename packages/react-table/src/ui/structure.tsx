import * as React from "react";
import { Pagination } from "@biugle/react-components";
import type { TablePagination as TablePaginationConfig } from "./types.js";
import { getBiuTableLocaleText, type BiuTableLocale, type BiuTableLocaleTextOverrides } from "../locale/index.js";
export const TableHeader = "thead" as const;
export const TableBody = "tbody" as const;
export const TableFooter = "tfoot" as const;
export const TableRow = "tr" as const;
export const TableHead = "th" as const;
export const TableCell = "td" as const;
export const TableCaption = "caption" as const;
export const TableEmpty = ({ children, locale, localeText }: TableStatusProps) => {
  const text = getBiuTableLocaleText(locale, localeText);
  return <div className="biu-table__empty">{children ?? text["暂无数据"]}</div>;
};
export const TableLoading = ({ children, locale, localeText }: TableStatusProps) => {
  const text = getBiuTableLocaleText(locale, localeText);
  return <div className="biu-table__loading">{children ?? text["加载中…"]}</div>;
};

interface TableStatusProps {
  children?: React.ReactNode;
  locale?: BiuTableLocale;
  localeText?: BiuTableLocaleTextOverrides;
}
export interface TablePaginationProps extends TablePaginationConfig {
  className?: string;
  previousText?: React.ReactNode;
  nextText?: React.ReactNode;
  locale?: BiuTableLocale;
  localeText?: BiuTableLocaleTextOverrides;
}

export const TablePagination = ({
  current = 1,
  pageSize = 20,
  total = 0,
  onChange,
  onShowSizeChange,
  pageSizeOptions,
  showSizeChanger,
  showQuickJumper = false,
  quickJumperWidth = 90,
  responsive = true,
  className,
  previousText,
  nextText,
  locale,
  localeText,
}: TablePaginationProps) => {
  const text = getBiuTableLocaleText(locale, localeText);
  return (
    <Pagination
      className={["biu-table__pagination", responsive && "biu-table__pagination--responsive", className]
        .filter(Boolean)
        .join(" ")}
      current={current}
      pageSize={pageSize}
      total={total}
      pageSizeOptions={[...(pageSizeOptions ?? [10, 20, 50]), pageSize].filter(
        (size, index, options) => options.indexOf(size) === index,
      )}
      showSizeChanger={showSizeChanger !== false}
      showQuickJumper={showQuickJumper}
      quickJumperWidth={quickJumperWidth}
      responsive={responsive}
      locale={locale}
      localeText={{ ...localeText, "/ 页": text["条/页"] }}
      onChange={(nextCurrent, nextPageSize) => {
        onChange?.(nextCurrent, nextPageSize);
        if (nextPageSize !== pageSize) onShowSizeChange?.(nextCurrent, nextPageSize);
      }}
      itemRender={(_page, type, element) =>
        type === "prev" && previousText ? previousText : type === "next" && nextText ? nextText : element
      }
      classNames={{
        sizeSelect: "biu-table__pagination-select",
        jumper: "biu-table__quick-jumper",
        jumperInput: "biu-table__quick-jumper-input",
      }}
    />
  );
};
export const TableSelectionCell = ({ children }: { children?: React.ReactNode }) => (
  <td className="biu-table__selection-cell">{children}</td>
);
export const TableExpandCell = ({ children }: { children?: React.ReactNode }) => (
  <td className="biu-table__expand-cell">{children}</td>
);
