import { useEffect, useRef } from "react";

/**
 * Esc 关闭 + Focus trap + body scroll lock for modal dialogs.
 *
 * IMPORTANT: callers typically pass an inline arrow as onClose, which gives
 * the effect a fresh identity on every parent render. We keep `onClose` in a
 * ref so the effect only runs once per `open` transition — otherwise
 * `lastFocusedRef` would be overwritten with whatever element happened to be
 * focused at the time of the latest parent render, and focus restoration on
 * dialog close would land on a stale (often unmounted) inner element.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 */
export default function useDialogA11y(open, onClose) {
  const containerRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusable = () => {
      if (!containerRef.current) return [];
      return Array.from(
        containerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const handleKey = (e) => {
      if (e.key === "Escape") {
        // stopImmediatePropagation ensures stacked dialogs (if any) don't all close.
        e.stopImmediatePropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key === "Tab") {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);

    const focusTimer = setTimeout(() => {
      const focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(focusTimer);
      if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === "function") {
        lastFocusedRef.current.focus();
      }
    };
    // Intentionally exclude onClose — see ref pattern above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return containerRef;
}
