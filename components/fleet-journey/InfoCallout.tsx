'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface InfoCalloutProps {
  icon?: ReactNode;
  title?: string;
  children: ReactNode;
}

/**
 * Prose bridge between panels in a chapter — short explanation of how
 * to read the charts that follow. Used sparingly; most chapters work
 * without callouts, but dense sections benefit from orientation.
 */
export function InfoCallout({ icon, title, children }: InfoCalloutProps) {
  return (
    <div className="rounded-md border border-muted-foreground/20 bg-muted/30 px-4 py-3 text-sm">
      <div className="mb-1 flex items-center gap-2 text-foreground">
        {icon ?? <Info className="h-3.5 w-3.5 text-muted-foreground" />}
        {title && <span className="font-medium">{title}</span>}
      </div>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
