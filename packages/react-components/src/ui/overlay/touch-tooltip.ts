import * as React from "react";

const TOUCH_TOOLTIP_OPEN_DELAY_MS = 700;
const TOUCH_TOOLTIP_CLOSE_DELAY_MS = 1500;
const TOUCH_TOOLTIP_MOVE_TOLERANCE_PX = 10;

interface TouchPress {
  pointerId: number;
  startX: number;
  startY: number;
  opened: boolean;
}

export interface TouchLongPressHandlers {
  onPointerDown: React.PointerEventHandler<HTMLSpanElement>;
  onPointerMove: React.PointerEventHandler<HTMLSpanElement>;
  onPointerUp: React.PointerEventHandler<HTMLSpanElement>;
  onPointerCancel: React.PointerEventHandler<HTMLSpanElement>;
  onClickCapture: React.MouseEventHandler<HTMLSpanElement>;
}

/**
 * On touch screens a hover-only Tooltip has no entry gesture. Use the common
 * long-press pattern while leaving short taps and scroll gestures untouched by
 * default. Passive truncated text may opt into a short-tap callback; a long
 * press consumes its synthetic click so it cannot accidentally activate a
 * wrapped action while the user is trying to read help.
 */
export function useTouchLongPress(
  onOpen: () => boolean,
  onClose: () => void,
  onTap?: () => void,
): TouchLongPressHandlers {
  const pressRef = React.useRef<TouchPress | undefined>(undefined);
  const openTimerRef = React.useRef<number | undefined>(undefined);
  const closeTimerRef = React.useRef<number | undefined>(undefined);
  const tapPendingRef = React.useRef(false);
  const onOpenRef = React.useRef(onOpen);
  const onCloseRef = React.useRef(onClose);
  const onTapRef = React.useRef(onTap);
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;
  onTapRef.current = onTap;

  const clearOpenTimer = () => {
    if (openTimerRef.current !== undefined && typeof window !== "undefined") {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = undefined;
    }
  };
  const clearCloseTimer = () => {
    if (closeTimerRef.current !== undefined && typeof window !== "undefined") {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }
  };

  React.useEffect(
    () => () => {
      if (typeof window === "undefined") return;
      if (openTimerRef.current !== undefined) window.clearTimeout(openTimerRef.current);
      if (closeTimerRef.current !== undefined) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  const onPointerDown: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    if (event.pointerType !== "touch" || event.isPrimary === false) {
      tapPendingRef.current = false;
      return;
    }
    clearOpenTimer();
    clearCloseTimer();
    tapPendingRef.current = false;
    const previousPress = pressRef.current;
    if (previousPress?.opened) onCloseRef.current();

    const press: TouchPress = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      opened: false,
    };
    pressRef.current = press;
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = undefined;
      if (pressRef.current !== press) return;
      press.opened = onOpenRef.current();
    }, TOUCH_TOOLTIP_OPEN_DELAY_MS);
  };

  const onPointerMove: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    if (event.pointerType !== "touch") return;
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId || press.opened) return;
    if (
      Math.abs(event.clientX - press.startX) > TOUCH_TOOLTIP_MOVE_TOLERANCE_PX ||
      Math.abs(event.clientY - press.startY) > TOUCH_TOOLTIP_MOVE_TOLERANCE_PX
    ) {
      clearOpenTimer();
      pressRef.current = undefined;
    }
  };

  const onPointerUp: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    if (event.pointerType !== "touch") return;
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    clearOpenTimer();
    if (!press.opened) {
      pressRef.current = undefined;
      tapPendingRef.current = Boolean(onTapRef.current);
      return;
    }
    tapPendingRef.current = false;
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = undefined;
      if (pressRef.current !== press) return;
      onCloseRef.current();
      pressRef.current = undefined;
    }, TOUCH_TOOLTIP_CLOSE_DELAY_MS);
  };

  const onPointerCancel: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    if (event.pointerType !== "touch") return;
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    clearOpenTimer();
    clearCloseTimer();
    tapPendingRef.current = false;
    if (press.opened) onCloseRef.current();
    pressRef.current = undefined;
  };

  const onClickCapture: React.MouseEventHandler<HTMLSpanElement> = (event) => {
    if (event.detail === 0) return;
    if (pressRef.current?.opened) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (tapPendingRef.current) {
      tapPendingRef.current = false;
      onTapRef.current?.();
    }
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture };
}
