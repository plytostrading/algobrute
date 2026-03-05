'use client';

/**
 * useBacktestBackground
 *
 * Tracks backtest jobs that were submitted and may still be running while the
 * user navigates elsewhere in the app.  Jobs are persisted in localStorage so
 * they survive page refreshes and tab switches.
 *
 * The hook is SSR-safe: all localStorage access is guarded by
 * `typeof window !== 'undefined'`.
 *
 * BacktestJobNotifier (in components/layout/) consumes this hook to fire
 * sonner toasts when a tracked job transitions to complete or failed.
 * workbench/page.tsx consumes latestActiveJob to restore the active job on
 * navigation return.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'algobrute:bg_jobs';

export interface BackgroundJob {
  jobId: string;
  strategyId: string;
  ticker: string;
  /** ISO-8601 string of when the job was submitted */
  submittedAt: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers (always SSR-safe)
// ---------------------------------------------------------------------------

function readJobs(): BackgroundJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BackgroundJob[]) : [];
  } catch {
    // Storage unavailable or corrupt — degrade gracefully
    return [];
  }
}

function writeJobs(jobs: BackgroundJob[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // Storage full or unavailable — silently degrade; state still held in React
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBacktestBackground() {
  const [jobs, setJobs] = useState<BackgroundJob[]>(() => readJobs());

  // Keep state in sync if another tab modifies the same localStorage key
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setJobs(readJobs());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /**
   * Register a newly submitted job.  Idempotent: re-adding the same jobId
   * is a no-op.
   */
  const addJob = useCallback(
    (jobId: string, strategyId: string, ticker: string) => {
      setJobs((prev) => {
        if (prev.some((j) => j.jobId === jobId)) return prev;
        const next: BackgroundJob[] = [
          ...prev,
          { jobId, strategyId, ticker, submittedAt: new Date().toISOString() },
        ];
        writeJobs(next);
        return next;
      });
    },
    [],
  );

  /**
   * Remove a job from the tracked list (called after it completes or fails,
   * or when the user explicitly resets the workbench).
   */
  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => {
      const next = prev.filter((j) => j.jobId !== jobId);
      writeJobs(next);
      return next;
    });
  }, []);

  /**
   * The most recently submitted tracked job, by submittedAt.
   * Returns null when there are no tracked jobs.
   */
  const latestActiveJob: string | null =
    jobs.length > 0
      ? [...jobs].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
          .jobId
      : null;

  return { jobs, addJob, removeJob, latestActiveJob };
}
