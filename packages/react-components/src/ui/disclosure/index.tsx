import * as React from "react";
import { cx, useControllableState } from "../../shared/utils.js";

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  classNames?: CollapsibleClassNames;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsible() {
  const context = React.useContext(CollapsibleContext);
  if (!context) throw new Error("Collapsible parts must be used within Collapsible");
  return context;
}

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  classNames?: CollapsibleClassNames;
}

export interface CollapsibleClassNames {
  root?: string;
  trigger?: string;
  content?: string;
}

export function Collapsible({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  classNames,
  children,
  ...props
}: CollapsibleProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const contentId = `biu-collapsible-${React.useId().replace(/:/g, "")}`;
  return (
    <CollapsibleContext.Provider value={{ open, setOpen, contentId, classNames }}>
      <div
        {...props}
        className={cx("biu-ui-collapsible", classNames?.root, className)}
        data-state={open ? "open" : "closed"}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function CollapsibleTrigger({ className, onClick, ...props }, ref) {
    const { open, setOpen, contentId, classNames } = useCollapsible();
    return (
      <button
        {...props}
        ref={ref}
        type="button"
        className={cx("biu-ui-collapsible__trigger", classNames?.trigger, className)}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(!open);
        }}
      />
    );
  },
);

export const CollapsibleContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CollapsibleContent({ className, children, ...props }, ref) {
    const { open, contentId, classNames } = useCollapsible();
    return (
      <div
        {...props}
        ref={ref}
        id={contentId}
        className={cx("biu-ui-collapsible__content", classNames?.content, className)}
        data-state={open ? "open" : "closed"}
        hidden={!open}
      >
        {children}
      </div>
    );
  },
);
