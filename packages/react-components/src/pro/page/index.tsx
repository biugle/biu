import * as React from "react";
import { Ellipsis, Empty, InputNumber, Loading, Select, TextField, Tooltip } from "../../ui/index.js";
import { CircleHelp } from "@biugle/icons";
import {
  Page,
  PageActions,
  PageBody,
  PageDescription,
  PageFooter,
  PageHeader,
  PageTitle,
  type DialogCloseReason,
} from "../../ui/index.js";
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
  /** Caller-owned PageHeader content, such as full-width tabs. */
  header?: React.ReactNode;
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
  header,
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
    <Page {...props} className={cx("biu-page-box", "biu-pro-page-box", className)}>
      {header !== undefined ? (
        <PageHeader>{header}</PageHeader>
      ) : title !== undefined || description !== undefined || actions ? (
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
  /** Optional fixed item width; when omitted the PageFilter grid calculates it from the container. */
  width?: number | string;
  required?: boolean;
  tooltip?: React.ReactNode;
  children?: React.ReactNode;
  classNames?: PageFilterItemClassNames;
  /** Internal PageFilter layout marker; callers should not set this. */
  pageFilterIndex?: string;
}

function withPageFilterFieldContract(children: React.ReactNode) {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement<{ className?: string; size?: string }>(child)) return child;
    const sizeProps =
      (child.type === TextField || child.type === InputNumber || child.type === Select) &&
      child.props.size === undefined
        ? { size: "small" }
        : {};
    return React.cloneElement(child, {
      ...sizeProps,
      className: cx("w-full", child.props.className),
    });
  });
}

function flattenPageFilterChildren(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment) {
      return flattenPageFilterChildren(child.props.children);
    }
    return [child];
  });
}

/** A floating-label field used inside PageFilter; the control remains owned by the caller. */
export function PageFilterItem({
  label,
  width,
  required = false,
  tooltip,
  children,
  className,
  classNames,
  pageFilterIndex,
  ...props
}: PageFilterItemProps) {
  return (
    <div
      {...props}
      className={cx("biu-pro-page-filter__item", classNames?.root, className)}
      style={
        {
          ...props.style,
          ...(width !== undefined
            ? { "--biu-page-filter-item-width": typeof width === "number" ? `${width}px` : width }
            : {}),
        } as React.CSSProperties
      }
      data-biu-component="page-filter-item"
      data-biu-page-filter-item-width={width !== undefined ? String(width) : undefined}
      data-biu-page-filter-index={pageFilterIndex}
    >
      <span className={cx("biu-pro-page-filter__item-label", classNames?.label)}>
        <span className="biu-pro-page-filter__item-label-text">{label}</span>
        {required ? <em aria-hidden="true">*</em> : null}
        {tooltip ? (
          <Tooltip
            content={tooltip}
            onlyOverflow={false}
            classNames={{ root: "biu-pro-page-filter__tooltip-root", trigger: "biu-pro-page-filter__tooltip-trigger" }}
          >
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
        {withPageFilterFieldContract(children)}
      </span>
    </div>
  );
}

export interface PageFilterProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  /** Called by the generated reset action when no custom actions slot is supplied. */
  onReset?: () => void;
  /** Called by the generated search action when no custom actions slot is supplied. */
  onSearch?: () => void;
  resetText?: React.ReactNode;
  searchText?: React.ReactNode;
  resetButtonProps?: Omit<React.ComponentProps<typeof Button>, "children" | "onClick">;
  searchButtonProps?: Omit<React.ComponentProps<typeof Button>, "children" | "onClick">;
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
  /** Minimum inline grid track width in pixels; narrow containers fall back to a single track. */
  itemMinWidth?: number;
  /** Automatically detect fields beyond maxRows and expose them through the more-filters action. */
  autoCollapse?: boolean;
  classNames?: PageFilterClassNames;
}

function PageFilterComponent({
  children,
  actions,
  onReset,
  onSearch,
  resetText,
  searchText,
  resetButtonProps,
  searchButtonProps,
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
  itemMinWidth = 170,
  autoCollapse = true,
  className,
  classNames,
  ...props
}: PageFilterProps) {
  const text = useComponentsLocale(drawerProps?.locale, drawerProps?.localeText);
  const [internalDrawerOpen, setInternalDrawerOpen] = React.useState(defaultDrawerOpen);
  const rowLimit = Number.isFinite(maxRows) ? Math.min(2, Math.max(1, Math.floor(maxRows))) : 2;
  const minimumWidth = Number.isFinite(itemMinWidth) && itemMinWidth > 0 ? itemMinWidth : 170;
  // JSX children can be wrapped in an implicit Fragment by the caller. The
  // layout must see each PageFilterItem separately or
  // the overflow calculation treats the whole fragment as one field.
  const inlineChildren = flattenPageFilterChildren(children);
  const [autoOverflow, setAutoOverflow] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(inlineChildren.length);
  const [gridColumns, setGridColumns] = React.useState(1);
  const [layoutReady, setLayoutReady] = React.useState(false);
  const fieldsRef = React.useRef<HTMLDivElement>(null);
  const drawerOpen = drawerOpenProp ?? internalDrawerOpen;
  const explicitMoreFields = moreFields !== undefined && moreFields !== null;
  // Keep an open Drawer mounted when a wider viewport makes every field fit.
  // Otherwise resizing would discard focus and leave the open state behind,
  // causing the Drawer to reopen unexpectedly when the viewport narrows again.
  const hasMoreFields = explicitMoreFields || (autoCollapse && autoOverflow) || drawerOpen;
  // Auto collapse only reserves a grid cell after overflow is real. Reserving
  // it up front leaves an empty trailing cell on ordinary one/two-row filters.
  // Generated actions are real content too and must participate in the same
  // first-paint contract as a caller supplied actions slot.
  const hasActionSlot = Boolean(actions || onReset || onSearch || hasMoreFields);
  const collapsedInline = autoCollapse && autoOverflow;
  // Keep the first paint bounded while the container width is being measured.
  // The layout effect below runs before the browser paints, so normal pages
  // immediately switch to the measured capacity without showing clipped rows.
  const renderedChildren = !layoutReady
    ? inlineChildren.slice(0, Math.max(0, rowLimit - (hasActionSlot ? 1 : 0)))
    : collapsedInline
      ? inlineChildren.slice(0, visibleCount)
      : inlineChildren;
  const generatedActions =
    actions === undefined && (onReset || onSearch) ? (
      <div className="biu-pro-page-filter__generated-actions">
        {onReset ? (
          <Button
            {...resetButtonProps}
            type={resetButtonProps?.type ?? "secondary"}
            variant={resetButtonProps?.variant ?? "contained"}
            size={resetButtonProps?.size ?? "small"}
            onClick={onReset}
          >
            {resetText ?? text["重置"]}
          </Button>
        ) : null}
        {onSearch ? (
          <Button
            {...searchButtonProps}
            type={searchButtonProps?.type ?? "dark"}
            variant={searchButtonProps?.variant ?? "contained"}
            size={searchButtonProps?.size ?? "small"}
            onClick={onSearch}
          >
            {searchText ?? text["查询"]}
          </Button>
        ) : null}
      </div>
    ) : null;
  const resolvedActions = actions ?? generatedActions;

  React.useLayoutEffect(() => {
    const fields = fieldsRef.current;
    if (!fields || inlineChildren.length === 0) {
      setAutoOverflow(false);
      setVisibleCount(inlineChildren.length);
      setGridColumns(1);
      setLayoutReady(true);
      return undefined;
    }
    const measure = () => {
      // Count the supplied fields, never the collapsed DOM prefix. A second
      // hidden render would mount input effects and duplicate IDs just to
      // obtain a count which is already available from the React children.
      const computed = window.getComputedStyle(fields);
      const gap = Number.parseFloat(computed.columnGap || computed.gap || "0") || 0;
      const containerWidth = fields.getBoundingClientRect().width;
      if (containerWidth <= 0) {
        // Hidden tabs and test DOMs can report zero before the host lays out.
        // Keep the bounded first paint and let ResizeObserver recalculate once
        // the filter has a measurable width.
        setAutoOverflow(false);
        setVisibleCount(inlineChildren.length);
        setGridColumns(1);
        setLayoutReady(false);
        return;
      }
      const action = fields.querySelector<HTMLElement>("[data-biu-page-filter-actions]");
      // The rendered fields and this calculation use the same grid contract:
      // choose the maximum number of columns that can keep an item at its
      // minimum width, then reserve the final cell for the action cluster.
      const fixedWidths = inlineChildren.flatMap((child) => {
        if (!React.isValidElement<{ width?: number | string }>(child) || child.props.width === undefined) return [];
        const value = child.props.width;
        if (typeof value === "number" && Number.isFinite(value)) return [value];
        const parsed = Number.parseFloat(String(value));
        return /^\s*\d+(?:\.\d+)?px\s*$/i.test(String(value)) && Number.isFinite(parsed) ? [parsed] : [];
      });
      // Balance the fields across the configured row limit first. The action
      // cluster is a real grid item, so it must be included before choosing
      // the number of tracks; otherwise the last field or the actions spill
      // into a third row. The measured width only caps this balanced count on
      // narrow hosts.
      const actionWidth = action ? Math.max(action.scrollWidth, action.getBoundingClientRect().width) : 0;
      const minItemWidth = Math.max(minimumWidth, actionWidth, ...fixedWidths);
      const compactViewport = window.matchMedia?.("(max-width: 760px)").matches ?? false;
      const actionSlots = action || hasActionSlot ? 1 : 0;
      const itemCount = inlineChildren.length + actionSlots;
      const balancedColumns = Math.max(1, Math.ceil(itemCount / rowLimit));
      const widthColumns = Math.max(1, Math.floor((containerWidth + gap) / (minItemWidth + gap)));
      const usableColumns = compactViewport ? 1 : Math.min(6, balancedColumns, widthColumns);
      setGridColumns(usableColumns);
      const visibleCapacity = Math.max(0, rowLimit * usableColumns - actionSlots);
      if (inlineChildren.length <= visibleCapacity) {
        setAutoOverflow(false);
        setVisibleCount(inlineChildren.length);
        setLayoutReady(true);
        return;
      }
      if (autoCollapse) {
        setAutoOverflow(true);
        setVisibleCount(Math.min(inlineChildren.length, visibleCapacity));
      } else {
        setAutoOverflow(false);
        setVisibleCount(inlineChildren.length);
      }
      setLayoutReady(true);
    };
    // Measuring synchronously in a layout effect prevents the initial full
    // field list from being clipped by the two-row contract for one frame.
    measure();
    // PageFilter is often mounted inside a page surface whose width settles
    // after its first layout pass. Re-measure on the next frame so an early
    // narrow measurement cannot leave the grid with stale implicit columns.
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(measure);
    });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : undefined;
    observer?.observe(fields);
    const action = fields.querySelector<HTMLElement>("[data-biu-page-filter-actions]");
    if (action) observer?.observe(action);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [
    autoCollapse,
    hasActionSlot,
    children,
    minimumWidth,
    rowLimit,
    actions,
    onReset,
    onSearch,
    resetText,
    searchText,
    moreLabel,
    resetButtonProps,
    searchButtonProps,
    moreButtonProps,
  ]);

  const setDrawerOpen = (open: boolean) => {
    if (drawerOpenProp === undefined) setInternalDrawerOpen(open);
    onDrawerOpenChange?.(open);
  };
  if (inlineChildren.length === 0 && !resolvedActions && !hasMoreFields) return null;
  const moreContent =
    typeof moreLabel === "string" || typeof moreLabel === "number" ? (
      <Ellipsis
        content={moreLabel}
        tooltipContent={moreLabel}
        maxWidth="100%"
        className="biu-pro-page-filter__button-label"
      />
    ) : (
      (moreLabel ?? text["更多"])
    );
  return (
    <section {...props} className={cx("biu-pro-page-filter", classNames?.root, className)}>
      <div
        ref={fieldsRef}
        className={cx("biu-pro-page-filter__fields", classNames?.fields)}
        style={
          {
            "--biu-page-filter-columns": gridColumns,
          } as React.CSSProperties
        }
      >
        {renderedChildren.map((child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { pageFilterIndex: String(index) } as Partial<PageFilterItemProps>)
            : child,
        )}
        {resolvedActions || hasMoreFields ? (
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
            {resolvedActions}
          </div>
        ) : null}
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
          onOpenChange={(nextOpen: boolean, reason?: DialogCloseReason) => {
            if (drawerOpenProp === undefined) setInternalDrawerOpen(nextOpen);
            onDrawerOpenChange?.(nextOpen);
            drawerProps?.onOpenChange?.(nextOpen, reason);
          }}
        >
          <div className="biu-pro-page-filter__drawer-fields" data-biu-slot="page-filter-drawer-fields">
            {includeVisibleFieldsInDrawer ? inlineChildren : autoOverflow ? inlineChildren.slice(visibleCount) : null}
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

export {
  Page,
  PageActions,
  PageBody,
  PageDescription,
  PageFooter,
  PageHeader,
  PageTitle,
  PageToolbar,
} from "../../ui/page/index.js";
