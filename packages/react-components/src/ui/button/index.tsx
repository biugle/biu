import * as React from "react";
import { cx, type BiuClassNames, type BiuSize } from "../../shared/utils.js";
import { Tooltip } from "../overlay/index.js";

export type ButtonType = "primary" | "warning" | "error" | "success" | "secondary" | "dark" | "default";
type ButtonDesignType = ButtonType | "danger" | "ghost" | "link";
export type ButtonVariant = "contained" | "text" | "outlined";
export type ButtonShape = "default" | "round" | "circle" | "square";
export type ButtonIconPosition = "before" | "after" | "center";

export interface ButtonClassNames extends BiuClassNames {
  root?: string;
  icon?: string;
  spinner?: string;
  content?: string;
}

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  type?: ButtonDesignType | "button" | "submit" | "reset";
  htmlType?: "button" | "submit" | "reset";
  variant?: ButtonVariant | "primary" | "secondary" | "ghost" | "danger" | "link";
  size?: BiuSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconSize?: number | string;
  iconPosition?: ButtonIconPosition;
  /** Render a square icon-only trigger and expose its content through Tooltip. */
  onlyIcon?: boolean;
  /** @deprecated Use onlyIcon. */
  iconOnly?: boolean;
  /** Override the Tooltip content used by an onlyIcon button. */
  tooltip?: React.ReactNode;
  block?: boolean;
  shape?: ButtonShape;
  readonly?: boolean;
  classNames?: ButtonClassNames;
}

function normalizeType(value: ButtonProps["type"]): ButtonType {
  if (value === "danger") return "error";
  if (value === "ghost" || value === "link" || value === "button" || value === "submit" || value === "reset")
    return "default";
  return (value as ButtonType) ?? "primary";
}

function normalizeVariant(value: ButtonProps["variant"]): ButtonVariant {
  if (value === "ghost" || value === "link" || value === "text") return "text";
  if (value === "outlined") return "outlined";
  return "contained";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    type: typeProp,
    htmlType,
    variant: variantProp = "contained",
    size = "medium",
    loading = false,
    icon,
    iconSize,
    iconPosition = "before",
    onlyIcon = false,
    iconOnly = false,
    tooltip,
    block = false,
    shape = "default",
    readonly = false,
    className,
    classNames,
    disabled,
    children,
    "aria-label": ariaLabel,
    onClick,
    onPointerDown: onPointerDownProp,
    onKeyDown: onKeyDownProp,
    style,
    ...props
  },
  ref,
) {
  const legacySemanticType = [
    "primary",
    "warning",
    "error",
    "success",
    "secondary",
    "dark",
    "default",
    "danger",
  ].includes(String(variantProp))
    ? (variantProp as ButtonDesignType)
    : undefined;
  const buttonType = normalizeType(typeProp ?? legacySemanticType);
  const variant = normalizeVariant(variantProp);
  const isOnlyIcon = onlyIcon || iconOnly;
  const iconStyle = iconSize === undefined ? undefined : { fontSize: iconSize, width: iconSize, height: iconSize };
  const iconNode = icon ? (
    <span
      className={cx("biu-ui-button__icon", classNames?.icon)}
      style={iconStyle}
      aria-hidden={iconPosition === "center"}
    >
      {icon}
    </span>
  ) : null;
  const content =
    children === undefined ? null : (
      <span className={cx("biu-ui-button__content", classNames?.content)}>{children}</span>
    );
  const isDisabled = disabled || loading;
  const [pressed, setPressed] = React.useState(false);
  const pressedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (pressedTimer.current) clearTimeout(pressedTimer.current);
    },
    [],
  );
  const flashPressed = React.useCallback(() => {
    setPressed(true);
    if (pressedTimer.current) clearTimeout(pressedTimer.current);
    // Pointer down gives immediate feedback; the longer tail keeps the
    // acknowledgement visible on dark/contained buttons after the click.
    pressedTimer.current = setTimeout(() => setPressed(false), 420);
  }, []);
  const button = (
    <button
      {...props}
      ref={ref}
      type={htmlType ?? (typeProp === "submit" || typeProp === "reset" || typeProp === "button" ? typeProp : "button")}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-readonly={readonly || undefined}
      data-readonly={readonly || undefined}
      className={cx(
        "biu-ui-button",
        `biu-ui-button--${buttonType}`,
        `biu-ui-button--type-${buttonType}`,
        `biu-ui-button--variant-${variant}`,
        `biu-ui-button--${size}`,
        `biu-ui-button--shape-${shape}`,
        isOnlyIcon && "biu-ui-button--only-icon",
        block && "biu-ui-button--block",
        loading && "biu-ui-button--loading",
        readonly && "biu-ui-button--readonly",
        pressed && "biu-ui-button--pressed",
        className,
        classNames?.root,
      )}
      style={style}
      aria-label={ariaLabel ?? (typeof children === "string" ? children : undefined)}
      onPointerDown={(event) => {
        onPointerDownProp?.(event);
        if (!event.defaultPrevented && !isDisabled && !readonly) flashPressed();
      }}
      onKeyDown={(event) => {
        onKeyDownProp?.(event);
        if (!event.defaultPrevented && !isDisabled && !readonly && (event.key === "Enter" || event.key === " ")) {
          flashPressed();
        }
      }}
      onClick={(event) => {
        if (readonly) {
          event.preventDefault();
          return;
        }
        // Keep keyboard/mouse activation feedback consistent. Browsers do not
        // focus a button on click uniformly, so explicitly retain focus for
        // the shared focus ring and pressed state.
        event.currentTarget.focus();
        flashPressed();
        onClick?.(event);
      }}
    >
      {loading ? <span className={cx("biu-ui-button__spinner", classNames?.spinner)} aria-hidden="true" /> : null}
      {isOnlyIcon ? null : iconPosition === "before" ? iconNode : null}
      {isOnlyIcon ? iconNode : iconPosition === "center" && iconNode ? iconNode : null}
      {isOnlyIcon ? null : iconPosition !== "center" ? content : null}
      {isOnlyIcon ? null : iconPosition === "after" ? iconNode : null}
    </button>
  );
  return isOnlyIcon ? (
    <Tooltip content={tooltip ?? children ?? ariaLabel} onlyOverflow={false}>
      {button}
    </Tooltip>
  ) : (
    button
  );
});

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number | string;
  classNames?: {
    root?: string;
    item?: string;
  };
}

export function ButtonGroup({ children, gap = 8, className, style, classNames, ...props }: ButtonGroupProps) {
  const items = React.Children.map(children, (child) => {
    if (!classNames?.item || !React.isValidElement<{ className?: string }>(child)) return child;
    return React.cloneElement(child, {
      className: cx(child.props.className, classNames.item),
    });
  });
  return (
    <div
      {...props}
      className={cx("biu-ui-button-group", classNames?.root, className)}
      style={{ "--biu-button-group-gap": typeof gap === "number" ? `${gap}px` : gap, ...style } as React.CSSProperties}
      role="group"
    >
      {items}
    </div>
  );
}
