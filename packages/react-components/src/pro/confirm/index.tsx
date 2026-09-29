import * as React from "react";
import { Dialog, type ProDialogProps } from "../dialog/index.js";
import { fire } from "../../fire.js";

export interface ConfirmProps extends Omit<ProDialogProps, "children" | "title"> {
  title?: React.ReactNode;
  message?: React.ReactNode;
}

export function Confirm({ message, title, size = "small", ...props }: ConfirmProps) {
  return (
    <Dialog {...props} title={title} size={size}>
      {message}
    </Dialog>
  );
}

/** Mounts one Confirm instance into the document body and returns update/close/destroy controls. */
export const fireConfirm = fire(Confirm);
