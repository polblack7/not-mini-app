import React from "react";
import { cn } from "../../utils/cn";
import { NOTICE_KIND } from "../../constants/status";

export const Notice = ({ kind = NOTICE_KIND.SUCCESS, children, className }) => (
  <div
    className={cn(
      "notice",
      kind === NOTICE_KIND.ERROR ? "notice--error" : "notice--success",
      className
    )}
  >
    {children}
  </div>
);

/**
 * Renders the notice from `useNotice()` only if present. Convenience wrapper
 * so pages don't write `{notice && <Notice ...>}` repeatedly.
 */
export const NoticeSlot = ({ notice, className }) => {
  if (!notice) return null;
  return (
    <Notice kind={notice.kind} className={className}>
      {notice.message}
    </Notice>
  );
};
