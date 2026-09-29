import * as React from "react";
import { cx } from "../../shared/utils.js";

export function Page({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cx("biu-ui-page", className)}>
      {children}
    </div>
  );
}
export function PageHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <header {...props} className={cx("biu-ui-page__header", className)}>
      {children}
    </header>
  );
}
export function PageTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 {...props} className={cx("biu-ui-page__title", className)}>
      {children}
    </h1>
  );
}
export function PageDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={cx("biu-ui-page__description", className)}>
      {children}
    </p>
  );
}
export function PageActions({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cx("biu-ui-page__actions", className)}>
      {children}
    </div>
  );
}
export function PageBody({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <main {...props} className={cx("biu-ui-page__body", className)}>
      {children}
    </main>
  );
}
export function PageFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <footer {...props} className={cx("biu-ui-page__footer", className)}>
      {children}
    </footer>
  );
}

export function PageToolbar({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cx("biu-ui-page__toolbar", className)}>
      {children}
    </div>
  );
}
