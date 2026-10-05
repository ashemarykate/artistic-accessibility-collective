'use client';

import type { ReactNode } from 'react';
import { useLook } from './useLook';

/**
 * The black page wrapper for every Hot Topics screen. It carries the Look
 * (data-look) that the stylesheet reads, so the Plain switch can strip the
 * decoration everywhere at once. The pages put their own <main> inside it.
 */
export default function HotTopicsShell({ children }: { children: ReactNode }) {
  const [look] = useLook();
  return (
    <div className="ht-page" data-look={look}>
      {children}
    </div>
  );
}
