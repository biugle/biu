import * as React from "react";
import { CircleHelp } from "@biugle/icons";
import { cx } from "../../shared/utils.js";
import { Ellipsis, Tooltip } from "../overlay/index.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export type DetailValueAccessor<T> = keyof T | string | ((record: T, index: number) => unknown);

export interface DetailItemClassNames {
  root?: string;
  label?: string;
  value?: string;
  tooltip?: string;
}

export interface DetailItem<T extends object = Record<string, unknown>> {
  key: DetailValueAccessor<T>;
  title: React.ReactNode;
  dataIndex?: keyof T | string;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  span?: number;
  tooltip?: React.ReactNode;
  ellipsis?: boolean | { tooltip?: boolean; maxWidth?: number | string; lines?: number };
  className?: string;
  classNames?: DetailItemClassNames;
}

export interface DetailSectionClassNames {
  root?: string;
  header?: string;
  icon?: string;
  title?: string;
  body?: string;
}

export interface DetailSection<T extends object = Record<string, unknown>> {
  key?: string;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  items: DetailItem<T>[];
  columns?: number;
  bordered?: boolean;
  className?: string;
  classNames?: DetailSectionClassNames;
}

export interface DetailClassNames {
  root?: string;
  section?: string;
  sectionHeader?: string;
  sectionIcon?: string;
  sectionTitle?: string;
  sectionBody?: string;
  item?: string;
  label?: string;
  value?: string;
  tooltip?: string;
}

export interface DetailProps<T extends object = Record<string, unknown>> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  data: T;
  sections: DetailSection<T>[];
  columns?: number;
  gap?: number | string;
  bordered?: boolean;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  classNames?: DetailClassNames;
}

function readPath(value: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, part) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, value);
}

function isEmptyValue(value: unknown) {
  return value === undefined || value === null || value === "";
}

function resolveItemValue<T extends object>(item: DetailItem<T>, data: T, index: number) {
  const source = item.dataIndex ?? item.key;
  if (typeof source === "function") return source(data, index);
  return readPath(data, String(source));
}

function renderValue<T extends object>(item: DetailItem<T>, value: unknown, data: T, index: number, emptyText: string) {
  const rendered = item.render
    ? item.render(value, data, index)
    : isEmptyValue(value)
      ? emptyText
      : (value as React.ReactNode);
  if (!item.ellipsis) return rendered;
  const options = typeof item.ellipsis === "object" ? item.ellipsis : {};
  return (
    <Ellipsis
      content={rendered}
      tooltipContent={options.tooltip === false ? undefined : rendered}
      maxWidth={options.maxWidth ?? "100%"}
      lines={options.lines ?? 1}
      alwaysTooltip={options.tooltip === true}
      className="biu-ui-detail__ellipsis"
    />
  );
}

function DetailItemView<T extends object>({
  item,
  data,
  index,
  defaultColumns,
  classNames,
  text,
}: {
  item: DetailItem<T>;
  data: T;
  index: number;
  defaultColumns: number;
  classNames?: DetailClassNames;
  text: ReturnType<typeof useComponentsLocale>;
}) {
  const value = resolveItemValue(item, data, index);
  const span = Math.min(Math.max(item.span ?? 1, 1), Math.max(defaultColumns, 1));
  return (
    <div
      className={cx("biu-ui-detail__item", classNames?.item, item.classNames?.root, item.className)}
      style={{ gridColumn: `span ${span} / span ${span}` }}
      data-biu-detail-item={String(typeof item.key === "function" ? index : item.key)}
    >
      <div className={cx("biu-ui-detail__label", classNames?.label, item.classNames?.label)}>
        <span>{item.title}</span>
        {item.tooltip ? (
          <Tooltip content={item.tooltip} onlyOverflow={false}>
            <button
              type="button"
              className={cx("biu-ui-detail__tooltip", classNames?.tooltip, item.classNames?.tooltip)}
              aria-label={typeof item.tooltip === "string" ? item.tooltip : text["字段说明"]}
            >
              <CircleHelp size={13} aria-hidden="true" />
            </button>
          </Tooltip>
        ) : null}
      </div>
      <div className={cx("biu-ui-detail__value", classNames?.value, item.classNames?.value)}>
        {renderValue(item, value, data, index, text["无"])}
      </div>
    </div>
  );
}

export function Detail<T extends object>({
  data,
  sections,
  columns = 4,
  gap = 20,
  bordered = true,
  className,
  classNames,
  locale,
  localeText,
  style,
  ...props
}: DetailProps<T>) {
  const text = useComponentsLocale(locale, localeText);
  const safeColumns = Math.max(1, Math.floor(columns));
  return (
    <div
      {...props}
      className={cx("biu-ui-detail", classNames?.root, className)}
      data-biu-component="detail"
      style={{ gap: typeof gap === "number" ? `${gap}px` : gap, ...style }}
    >
      {sections.map((section, sectionIndex) => {
        const sectionColumns = Math.max(1, Math.floor(section.columns ?? safeColumns));
        return (
          <section
            key={section.key ?? sectionIndex}
            className={cx(
              "biu-ui-detail__section",
              bordered && section.bordered !== false && "biu-ui-detail__section--bordered",
              classNames?.section,
              section.classNames?.root,
              section.className,
            )}
            data-biu-detail-section={section.key ?? sectionIndex}
          >
            {section.title !== undefined || section.icon ? (
              <header
                className={cx("biu-ui-detail__section-header", classNames?.sectionHeader, section.classNames?.header)}
              >
                {section.icon ? (
                  <span
                    className={cx("biu-ui-detail__section-icon", classNames?.sectionIcon, section.classNames?.icon)}
                  >
                    {section.icon}
                  </span>
                ) : null}
                {section.title !== undefined ? (
                  <h3
                    className={cx("biu-ui-detail__section-title", classNames?.sectionTitle, section.classNames?.title)}
                  >
                    {section.title}
                  </h3>
                ) : null}
              </header>
            ) : null}
            <div
              className={cx("biu-ui-detail__section-body", classNames?.sectionBody, section.classNames?.body)}
              style={{ gridTemplateColumns: `repeat(${sectionColumns}, minmax(0, 1fr))` }}
            >
              {section.items.map((item, itemIndex) => (
                <DetailItemView
                  key={typeof item.key === "string" || typeof item.key === "number" ? String(item.key) : itemIndex}
                  item={item}
                  data={data}
                  index={itemIndex}
                  defaultColumns={sectionColumns}
                  classNames={classNames}
                  text={text}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
