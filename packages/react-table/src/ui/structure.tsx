import * as React from "react";
import { Select } from "@biugle/react-components";
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
  className,
  previousText,
  nextText,
  locale,
  localeText,
}: TablePaginationProps) => {
  const text = getBiuTableLocaleText(locale, localeText);
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return (
    <div className={["biu-table__pagination", className].filter(Boolean).join(" ")} aria-label={text["分页"]}>
      <button type="button" disabled={current <= 1} onClick={() => onChange?.(current - 1, pageSize)}>
        {previousText ?? text["上一页"]}
      </button>
      <span aria-live="polite">
        {current} / {pageCount}
      </span>
      <button type="button" disabled={current >= pageCount} onClick={() => onChange?.(current + 1, pageSize)}>
        {nextText ?? text["下一页"]}
      </button>
      {showSizeChanger !== false ? (
        <Select
          className="biu-table__pagination-select"
          value={String(pageSize)}
          options={(pageSizeOptions ?? [10, 20, 50]).map((size) => ({
            value: String(size),
            label: `${size} ${text["条/页"]}`,
          }))}
          onChange={(event) => {
            const nextPageSize = Number(event);
            onChange?.(1, nextPageSize);
            onShowSizeChange?.(1, nextPageSize);
          }}
          aria-label={text["每页条数"]}
        />
      ) : null}
    </div>
  );
};
export const TableSelectionCell = ({ children }: { children?: React.ReactNode }) => (
  <td className="biu-table__selection-cell">{children}</td>
);
export const TableExpandCell = ({ children }: { children?: React.ReactNode }) => (
  <td className="biu-table__expand-cell">{children}</td>
);
