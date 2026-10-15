import { Pagination } from "@biugle/react-components";
import type { TablePagination as PaginationOptions } from "./types.js";
import { cx } from "./column-utils.js";

export function TablePagination({
  pagination,
  className,
  pageSizeText,
  onChange,
}: {
  pagination: PaginationOptions;
  className?: string;
  pageSizeText: string;
  onChange: (current: number, pageSize: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(pagination.total / Math.max(1, pagination.pageSize)));
  if (pagination.hideOnSinglePage && pages <= 1) return null;
  const responsive = pagination.responsive !== false;
  return (
    <Pagination
      className={cx("biu-table__pagination", responsive && "biu-table__pagination--responsive", className)}
      current={pagination.current}
      pageSize={pagination.pageSize}
      total={pagination.total}
      pageSizeOptions={[...new Set([...(pagination.pageSizeOptions ?? [10, 20, 50]), pagination.pageSize])]}
      showSizeChanger={pagination.showSizeChanger !== false}
      showQuickJumper={pagination.showQuickJumper}
      quickJumperWidth={pagination.quickJumperWidth}
      showTotal={pagination.showTotal}
      simple={pagination.simple}
      responsive={responsive}
      hideOnSinglePage={pagination.hideOnSinglePage}
      showLessItems={pagination.showLessItems}
      itemRender={pagination.itemRender}
      locale={pagination.locale}
      localeText={{ ...pagination.localeText, "/ 页": pageSizeText }}
      onChange={onChange}
      classNames={{
        sizeSelect: "biu-table__pagination-select",
        jumper: "biu-table__quick-jumper",
        jumperInput: "biu-table__quick-jumper-input",
      }}
    />
  );
}
