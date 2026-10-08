import * as React from "react";
import { cx } from "../../shared/utils.js";

export interface LayoutClassNames {
  root?: string;
  header?: string;
  body?: string;
  footer?: string;
  viewport?: string;
  title?: string;
  description?: string;
}

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  classNames?: Pick<LayoutClassNames, "root">;
  /** CSS-in-JS object, array or resolver; `style` remains supported. */
  css?: BoxStyle;
  /** Shorthand CSS-in-JS style with the same merge semantics as `css`. */
  sx?: BoxStyle;
}

export type BoxStyle =
  React.CSSProperties | false | null | undefined | BoxStyle[] | ((theme: Record<string, unknown>) => BoxStyle);

function resolveBoxStyle(value: BoxStyle, theme: Record<string, unknown> = {}): React.CSSProperties {
  if (!value) return {};
  if (typeof value === "function") return resolveBoxStyle(value(theme), theme);
  if (Array.isArray(value)) {
    return value.reduce<React.CSSProperties>((result, item) => ({ ...result, ...resolveBoxStyle(item, theme) }), {});
  }
  return value;
}

export function Box({ as: Component = "div", className, classNames, css, sx, style, ...props }: BoxProps) {
  return (
    <Component
      {...props}
      className={cx("biu-ui-box", classNames?.root, className)}
      style={{ ...resolveBoxStyle(css), ...resolveBoxStyle(sx), ...style }}
    />
  );
}

export interface StackProps extends BoxProps {
  direction?: "row" | "column";
  gap?: number | string;
  align?: React.CSSProperties["alignItems"];
  justify?: React.CSSProperties["justifyContent"];
  wrap?: React.CSSProperties["flexWrap"];
}

export function Stack({
  direction = "row",
  gap = 8,
  align,
  justify,
  wrap,
  style,
  className,
  classNames,
  ...props
}: StackProps) {
  return (
    <Box
      {...props}
      className={cx("biu-ui-stack", `biu-ui-stack--${direction}`, className)}
      classNames={classNames}
      style={{
        gap: typeof gap === "number" ? `${gap}px` : gap,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap,
        ...style,
      }}
    />
  );
}

export interface GridProps extends BoxProps {
  columns?: number | string;
  gap?: number | string;
}

export function Grid({ columns = 2, gap = 12, style, className, classNames, ...props }: GridProps) {
  return (
    <Box
      {...props}
      className={cx("biu-ui-grid", className)}
      classNames={classNames}
      style={{
        gridTemplateColumns: typeof columns === "number" ? `repeat(${Math.max(1, columns)}, minmax(0, 1fr))` : columns,
        gap: typeof gap === "number" ? `${gap}px` : gap,
        ...style,
      }}
    />
  );
}

export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  classNames?: LayoutClassNames;
}

export function Card({ title, description, footer, children, className, classNames, ...props }: CardProps) {
  return (
    <article {...props} className={cx("biu-ui-card", classNames?.root, className)}>
      {title !== undefined || description !== undefined ? (
        <header className={cx("biu-ui-card__header", classNames?.header)}>
          <div>
            {title !== undefined ? <h3 className={classNames?.title}>{title}</h3> : null}
            {description !== undefined ? <p className={classNames?.description}>{description}</p> : null}
          </div>
        </header>
      ) : null}
      <div className={cx("biu-ui-card__body", classNames?.body)}>{children}</div>
      {footer !== undefined ? (
        <footer className={cx("biu-ui-card__footer", classNames?.footer)}>{footer}</footer>
      ) : null}
    </article>
  );
}

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  dashed?: boolean;
  classNames?: Pick<LayoutClassNames, "root"> & { content?: string };
}

export function Divider({
  orientation = "horizontal",
  dashed = false,
  children,
  className,
  classNames,
  ...props
}: DividerProps) {
  return (
    <div
      {...props}
      role="separator"
      aria-orientation={orientation}
      className={cx(
        "biu-ui-divider",
        `biu-ui-divider--${orientation}`,
        dashed && "biu-ui-divider--dashed",
        classNames?.root,
        className,
      )}
    >
      {children !== undefined ? <span className={classNames?.content}>{children}</span> : null}
    </div>
  );
}

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both";
  viewportClassName?: string;
}

export function ScrollArea({
  orientation = "vertical",
  viewportClassName,
  classNames,
  className,
  children,
  ...props
}: ScrollAreaProps & { classNames?: Pick<LayoutClassNames, "root" | "viewport"> }) {
  return (
    <div
      {...props}
      className={cx("biu-ui-scroll-area", `biu-ui-scroll-area--${orientation}`, classNames?.root, className)}
    >
      <div className={cx("biu-ui-scroll-area__viewport", classNames?.viewport, viewportClassName)}>{children}</div>
    </div>
  );
}
