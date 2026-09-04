'use client';

/**
 * useConfirm: an accessible replacement for window.confirm().
 *
 * Native confirm() cannot be styled, is announced inconsistently by screen
 * readers, and flattens any structure in the message. This hook renders the
 * question inside the shared Modal (focus trap, Escape, focus restore) and
 * resolves a promise with the answer, so call sites read almost the same:
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   ...
 *   if (!(await confirm({ title: 'Reject this profile?' }))) return;
 *   ...
 *   return <>{...}{confirmDialog}</>;
 *
 * Render `confirmDialog` once anywhere in the component's output.
 */

import React, { useCallback, useId, useRef, useState } from 'react';
import Modal from '@/components/Modal';

export interface ConfirmOptions {
  /** The question, used as the dialog's accessible name. */
  title: string;
  /** Optional detail under the title. Strings or JSX. */
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (red). */
  danger?: boolean;
}

export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;

  const confirm = useCallback((o: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOpts(o);
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpts(null);
  }, []);

  const confirmDialog = opts ? (
    <Modal
      labelledBy={titleId}
      onClose={() => settle(false)}
      initialFocusRef={cancelRef}
      dialogStyle={{
        background: '#fff',
        color: '#0d1e4a',
        border: '2px solid var(--aac-blue, #263590)',
        borderRadius: 8,
        padding: '1.25rem 1.5rem',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
      }}
    >
      <h2 id={titleId} style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', lineHeight: 1.3 }}>
        {opts.title}
      </h2>
      {opts.body && (
        <div id={bodyId} style={{ fontSize: '0.95rem', lineHeight: 1.55, margin: '0 0 1rem' }}>
          {typeof opts.body === 'string' ? <p style={{ margin: 0 }}>{opts.body}</p> : opts.body}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: opts.body ? 0 : '1rem' }}>
        <button ref={cancelRef} type="button" className="btn btn-outline" onClick={() => settle(false)}>
          {opts.cancelLabel ?? 'Cancel'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={opts.danger ? { background: '#b3261e', borderColor: '#b3261e' } : undefined}
          onClick={() => settle(true)}
        >
          {opts.confirmLabel ?? 'OK'}
        </button>
      </div>
    </Modal>
  ) : null;

  return { confirm, confirmDialog };
}
