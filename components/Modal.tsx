'use client';

/**
 * Modal — a single, correct focus-trapping dialog wrapper.
 *
 * It handles the four things every hand-rolled dialog in this app was getting
 * wrong: moving focus INTO the dialog on open, trapping Tab inside it, closing
 * on Escape, and restoring focus to whatever opened it on close.
 *
 * It is intentionally "headless" about looks: it renders a centered backdrop
 * plus a bare role="dialog" box, and the caller supplies all the inner chrome
 * and the box's own className/style. That keeps each dialog's retro styling
 * exactly as it was while making the behavior correct and shared.
 *
 * Usage:
 *   {open && (
 *     <Modal labelledBy="my-heading" onClose={() => setOpen(false)}
 *            dialogClassName="my-box" dialogStyle={{ width: 440 }}>
 *       <h2 id="my-heading">Title</h2>
 *       ...
 *     </Modal>
 *   )}
 */

import React, { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  /** id of the element inside that names the dialog (aria-labelledby). */
  labelledBy: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional class on the dialog box (not the backdrop). */
  dialogClassName?: string;
  /** Optional inline style on the dialog box. */
  dialogStyle?: React.CSSProperties;
  /** Optional inline style overrides for the backdrop. */
  backdropStyle?: React.CSSProperties;
  /** Element to focus first; defaults to the first focusable child. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Set false to keep the dialog open when the backdrop is clicked. */
  closeOnBackdrop?: boolean;
}

export default function Modal({
  labelledBy,
  onClose,
  children,
  dialogClassName,
  dialogStyle,
  backdropStyle,
  initialFocusRef,
  closeOnBackdrop = true,
}: ModalProps) {
  const dialogRef  = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Move focus in on open; restore it to the trigger on close.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const focusTarget = () => {
      const target =
        initialFocusRef?.current ??
        dialog.querySelector<HTMLElement>(FOCUSABLE) ??
        dialog;
      target.focus();
    };
    // Focus now (the DOM is committed by the time the effect runs) and again on
    // the next frame as a safety net in case layout/paint shifts focusability.
    focusTarget();
    const raf = requestAnimationFrame(focusTarget);

    return () => {
      cancelAnimationFrame(raf);
      // Restore focus to whatever opened the dialog, if it still exists.
      const trigger = triggerRef.current;
      if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) {
        trigger.focus();
      }
    };
    // Run once per mount; children/refs are stable for a given open dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0];
    const last  = nodes[nodes.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || active === dialog)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      // Backdrop. Not a focus target; the dialog inside owns focus.
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        ...backdropStyle,
      }}
      onPointerDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={dialogClassName}
        style={dialogStyle}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}
