'use client';

interface UnsupportedRecommendationActionPayload {
  recommendationType: string;
  botId?: string | null;
  botName?: string | null;
  source: 'recommendation-action-button';
}

export function trackUnsupportedRecommendationAction(
  payload: UnsupportedRecommendationActionPayload,
): void {
  if (typeof window === 'undefined') return;

  const detail = {
    ...payload,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  window.dispatchEvent(
    new CustomEvent('recommendation:unsupported-action', { detail }),
  );

  if (process.env.NODE_ENV !== 'production') {
    console.info('[telemetry] recommendation:unsupported-action', detail);
  }
}
