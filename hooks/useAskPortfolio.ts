'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import type { AnnotationOutput } from '@/types/api';

/**
 * Mutation for POST /api/fleet/question.
 *
 * Sends a natural language question about the fleet and returns an LLM-generated
 * AnnotationOutput { headline, explanation, action, severity }.
 *
 * The mutation does NOT cache results — conversation history is managed by
 * the calling component in local state.
 */
export function useAskPortfolio() {
  return useMutation<AnnotationOutput, Error, string>({
    mutationFn: async (question: string) => {
      const res = await apiFetch('/api/fleet/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to get an answer');
        throw new Error(detail);
      }
      return parseApiJson<AnnotationOutput>(res);
    },
  });
}
