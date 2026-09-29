import * as React from "react";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
} from "../dialog/index.js";
import { cx } from "../../shared/utils.js";

export interface DrawerProps extends DialogProps {
  placement?: "left" | "right" | "top" | "bottom";
  size?: string | number;
}

export function Drawer({ placement = "right", size = 420, className, children, style, ...props }: DrawerProps) {
  const dimension = placement === "left" || placement === "right" ? "--biu-drawer-size" : "--biu-drawer-height";
  return (
    <Dialog
      {...props}
      component="drawer"
      className={cx("biu-ui-drawer", `biu-ui-drawer--${placement}`, className)}
      style={{ ...style, [dimension]: typeof size === "number" ? `${size}px` : size } as React.CSSProperties}
    >
      {children}
    </Dialog>
  );
}

export {
  DialogTrigger as DrawerTrigger,
  DialogPortal as DrawerPortal,
  DialogOverlay as DrawerOverlay,
  DialogContent as DrawerContent,
  DialogHeader as DrawerHeader,
  DialogBody as DrawerBody,
  DialogFooter as DrawerFooter,
  DialogTitle as DrawerTitle,
  DialogDescription as DrawerDescription,
  DialogClose as DrawerClose,
};
