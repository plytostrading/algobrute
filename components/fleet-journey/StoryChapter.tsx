'use client';

import type { ReactNode } from 'react';

interface StoryChapterProps {
  number: number;
  title: string;
  kicker?: string;
  children: ReactNode;
}

/**
 * Numbered chapter wrapper for the 6-chapter Fleet Journey narrative.
 * Provides a visual separator + chapter identity while leaving the
 * internal composition of charts/cards to the chapter itself.
 */
export function StoryChapter({ number, title, kicker, children }: StoryChapterProps) {
  const anchor = `chapter-${number}`;
  return (
    <section aria-labelledby={anchor} className="space-y-5 border-t pt-8">
      <div className="flex items-end gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Chapter {number}
        </span>
        <div className="flex-1 space-y-0.5">
          <h2
            id={anchor}
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            {title}
          </h2>
          {kicker && (
            <p className="text-sm text-muted-foreground">{kicker}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
