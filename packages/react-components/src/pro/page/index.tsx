import * as React from "react";
import { Ellipsis, Empty, Loading, Tooltip } from "../../ui/index.js";
import { CircleHelp } from "@biugle/icons";
import { Page, PageActions, PageBody, PageDescription, PageFooter, PageHeader, PageTitle } from "../../ui/index.js";
import { Button } from "../../ui/index.js";
import { Drawer, type ProDrawerProps } from "../drawer/index.js";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export interface PageBoxProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  empty?: React.ReactNode | false;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

export function PageBox({
  title,
  description,
  actions,
  footer,
  loading = false,
  empty = false,
  locale,
  localeText,
  children,
  className,
  ...props
}: PageBoxProps) {
  const content = loading ? (
    <Loading locale={locale} localeText={localeText} />
  ) : empty !== false && !children ? (
    <Empty description={empty} locale={locale} localeText={localeText} />
  ) : (
    children
  );
  return (
    <Page {...props} className={cx("biu-pro-page-box", className)}>
      {title !== undefined || description !== undefined || actions ? (
        <PageHeader>
          <div>
            {title !== undefined ? <PageTitle>{title}</PageTitle> : null}
            {description ? <PageDescription>{description}</PageDescription> : null}
          </div>
          {actions ? <PageActions>{actions}</PageActions> : null}
        </PageHeader>
      ) : null}
      <PageBody>{content}</PageBody>
      {footer ? <PageFooter>{footer}</PageFooter> : null}
    </Page>
  );
}

export interface PageFilterClassNames {
  root?: string;
  fields?: string;
  actions?: string;
  more?: string;
  drawer?: string;
  drawerPanel?: string;
  drawerBody?: string;
  drawerFooter?: string;
}

export interface PageFilterItemClassNames {
  root?: string;
  label?: string;
  field?: string;
}

export interface PageFilterItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: React.ReactNode;
  required?: boolean;
  tooltip?: React.ReactNode;
  children?: React.ReactNode;
  classNames?: PageFilterItemClassNames;
}

function withPageFilterFieldClassName(children: React.ReactNode) {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement<{ className?: string }>(child)) return child;
    return React.cloneElement(child, {
      className: cx("w-full", child.props.className),
    });
  });
}

/** A floating-label field used inside PageFilter; the control remains owned by the caller. */
export function PageFilterItem({
  label,
  required = false,
  tooltip,
  children,
  className,
  classNames,
  ...props
}: PageFilterItemProps) {
  return (
    <div
      {...props}
      className={cx("biu-pro-page-filter__item", classNames?.root, className)}
      data-biu-component="page-filter-item"
    >
      <span className={cx("biu-pro-page-filter__item-label", classNames?.label)}>
        {label}
        {required ? <em aria-hidden="true">*</em> : null}
        {tooltip ? (
          <Tooltip content={tooltip} onlyOverflow={false}>
            <button
              type="button"
              className="biu-pro-page-filter__item-tooltip"
              aria-label={typeof tooltip === "string" ? tooltip : undefined}
            >
              <CircleHelp size={13} aria-hidden="true" />
            </button>
          </Tooltip>
        ) : null}
      </span>
      <span className={cx("biu-pro-page-filter__item-field", classNames?.field)}>
        {withPageFilterFieldClassName(children)}
      </span>
    </div>
  );
}

export interface PageFilterProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  /** Extra fields shown in a body-mounted Drawer when the user needs advanced filters. */
  moreFields?: React.ReactNode;
  /** Render the visible filter fields in the advanced Drawer as well. */
  includeVisibleFieldsInDrawer?: boolean;
  moreLabel?: React.ReactNode;
  moreButtonProps?: Omit<React.ComponentProps<typeof Button>, "children" | "onClick">;
  drawerTitle?: React.ReactNode;
  drawerWidth?: ProDrawerProps["size"];
  drawerFooter?: React.ReactNode;
  drawerProps?: Omit<ProDrawerProps, "open" | "children" | "title" | "footer" | "size">;
  drawerOpen?: boolean;
  defaultDrawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
  /** Maximum number of inline filter rows before the remaining fields are available in the Drawer. */
  maxRows?: number;
  /** Automatically detect fields beyond maxRows and expose them through the more-filters action. */
  autoCollapse?: boolean;
  classNames?: PageFilterClassNames;
}

function PageFilterComponent({
  children,
  actions,
  moreFields,
  includeVisibleFieldsInDrawer = true,
  moreLabel,
  moreButtonProps,
  drawerTitle,
  drawerWidth = "large",
  drawerFooter,
  drawerProps,
  drawerOpen: drawerOpenProp,
  defaultDrawerOpen = false,
  onDrawerOpenChange,
  maxRows = 2,
  autoCollapse = true,
  className,
  classNames,
  ...props
}: PageFilterProps) {
  const text = useComponentsLocale(drawerProps?.locale, drawerProps?.localeText);
  const [internalDrawerOpen, setInternalDrawerOpen] = React.useState(defaultDrawerOpen);
  const rowLimit = Math.max(1, Math.floor(maxRows));
  const inlineChildren = React.Children.toArray(children);
  const [autoOverflow, setAutoOverflow] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(inlineChildren.length);
  const [gridColumns, setGridColumns] = React.useState(1);
  const fieldsRef = React.useRef<HTMLDivElement>(null);
  const measurementRef = React.useRef<HTMLDivElement>(null);
  const drawerOpen = drawerOpenProp ?? internalDrawerOpen;
  const explicitMoreFields = moreFields !== undefined && moreFields !== null;
  const hasMoreFields = explicitMoreFields || (autoCollapse && autoOverflow);
  const hasActionSlot = Boolean(actions || explicitMoreFields || autoCollapse);
  const collapsedInline = autoCollapse && autoOverflow;
  const renderedChildren = collapsedInline ? inlineChildren.slice(0, visibleCount) : inlineChildren;

  React.useLayoutEffect(() => {
    const fields = fieldsRef.current;
    if (!fields || inlineChildren.length === 0) {
      setAutoOverflow(false);
      return undefined;
    }
    const measure = () => {
      // Keep measurement independent from the currently visible prefix. Once
      // the inline list is collapsed, measuring its reduced DOM would make
      // every resize callback believe that fewer fields exist.
      const measurement = measurementRef.current;
      const nodes = measurement
        ? [...measurement.querySelectorAll<HTMLElement>("[data-biu-page-filter-measure-index]")]
        : [...fields.querySelectorAll<HTMLElement>("[data-biu-page-filter-index]")];
      if (!nodes.length) {
        setAutoOverflow(false);
        setVisibleCount(inlineChildren.length);
        return;
      }
      const computed = window.getComputedStyle(fields);
      const gap = Number.parseFloat(computed.columnGap || computed.gap || "0") || 0;
      const containerWidth = fields.clientWidth;
      const action = fields.querySelector<HTMLElement>("[data-biu-page-filter-actions]");
      // The rendered fields and this calculation use the same grid contract:
      // choose the maximum number of columns that can keep an item at its
      // minimum width, then reserve the final cell for the action cluster.
      const minItemWidth = 200;
      const columns = Math.max(1, Math.floor((containerWidth + gap) / (minItemWidth + gap)));
      const itemCount = inlineChildren.length + (hasActionSlot ? 1 : 0);
      const usableColumns = Math.max(1, Math.min(columns, itemCount));
      setGridColumns(usableColumns);
      const actionSlots = action || hasActionSlot ? 1 : 0;
      const visibleCapacity = Math.max(1, rowLimit * usableColumns - actionSlots);
      if (nodes.length <= visibleCapacity) {
        setAutoOverflow(false);
        setVisibleCount(inlineChildren.length);
        return;
      }
      if (!autoCollapse) return;
      setAutoOverflow(true);
      setVisibleCount(Math.min(inlineChildren.length, visibleCapacity));
    };
    const frame = window.requestAnimationFrame(measure);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : undefined;
    observer?.observe(fields);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [autoCollapse, hasActionSlot, inlineChildren.length, rowLimit]);

  const setDrawerOpen = (open: boolean) => {
    if (drawerOpenProp === undefined) setInternalDrawerOpen(open);
    onDrawerOpenChange?.(open);
  };
  const moreContent =
    typeof moreLabel === "string" || typeof moreLabel === "number" ? (
      <Ellipsis
        content={moreLabel}
        tooltipContent={moreLabel}
        maxWidth="100%"
        className="biu-pro-page-filter__button-label"
      />
    ) : (
      (moreLabel ?? text["更多筛选"])
    );
  return (
    <section {...props} className={cx("biu-pro-page-filter", classNames?.root, className)}>
      <div
        ref={fieldsRef}
        className={cx("biu-pro-page-filter__fields", classNames?.fields)}
        style={
          {
            "--biu-page-filter-max-rows": rowLimit,
            "--biu-page-filter-columns": gridColumns,
            // Keep enough room for the floating label and the action cluster's
            // six-pixel vertical breathing room. The visible grid still owns
            // the configured row limit.
            "--biu-page-filter-max-height": `${rowLimit * 42 + (rowLimit - 1) * 12 + 8}px`,
          } as React.CSSProperties
        }
      >
        {renderedChildren.map((child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
                "data-biu-page-filter-index": String(index),
              } as Partial<React.HTMLAttributes<HTMLElement>>)
            : child,
        )}
        {actions || hasMoreFields ? (
          <div className={cx("biu-pro-page-filter__actions", classNames?.actions)} data-biu-page-filter-actions="true">
            {hasMoreFields ? (
              <Button
                {...moreButtonProps}
                type={moreButtonProps?.type ?? "secondary"}
                variant={moreButtonProps?.variant ?? "outlined"}
                size={moreButtonProps?.size ?? "small"}
                className={cx("biu-pro-page-filter__more", classNames?.more, moreButtonProps?.className)}
                aria-expanded={drawerOpen}
                aria-haspopup="dialog"
                onClick={() => setDrawerOpen(true)}
              >
                {moreContent}
              </Button>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
      <div
        ref={measurementRef}
        className="biu-pro-page-filter__measurement"
        aria-hidden="true"
        style={{ "--biu-page-filter-columns": gridColumns } as React.CSSProperties}
      >
        {inlineChildren.map((child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
                "data-biu-page-filter-measure-index": String(index),
              } as Partial<React.HTMLAttributes<HTMLElement>>)
            : child,
        )}
      </div>
      {hasMoreFields ? (
        <Drawer
          {...drawerProps}
          open={drawerOpen}
          title={drawerTitle ?? text["更多筛选"]}
          size={drawerWidth}
          footer={drawerFooter}
          className={cx("biu-pro-page-filter__drawer", classNames?.drawer, drawerProps?.className)}
          classNames={{
            ...(drawerProps?.classNames ?? {}),
            panel: cx(drawerProps?.classNames?.panel, classNames?.drawerPanel),
            body: cx(drawerProps?.classNames?.body, classNames?.drawerBody),
            footer: cx(drawerProps?.classNames?.footer, classNames?.drawerFooter),
          }}
          locale={drawerProps?.locale}
          localeText={{ ...drawerProps?.localeText, 取消: text["取消"], 确定: text["确定"] }}
          onOpenChange={(open, reason) => {
            setDrawerOpen(open);
            drawerProps?.onOpenChange?.(open, reason);
          }}
        >
          <div className="biu-pro-page-filter__drawer-fields" data-biu-slot="page-filter-drawer-fields">
            {includeVisibleFieldsInDrawer || autoOverflow ? children : null}
            {moreFields}
          </div>
        </Drawer>
      ) : null}
    </section>
  );
}

export const PageFilter = Object.assign(PageFilterComponent, {
  Item: PageFilterItem,
});
