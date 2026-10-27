import type { BriefIssue, NormalizedDraft } from '@utsav/core';

export interface ExtractResponse {
  readonly draft: NormalizedDraft;
  readonly missing: readonly BriefIssue[];
  readonly today: string;
}

/** An AI-suggested idea, already checked by the server against this plan's budget. */
export interface AiIdea {
  readonly title: string;
  readonly description: string;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly estimatedCost: number;
  readonly shareOfCategory: number;
}

/** A request failure whose message is safe and meant to be shown to the host. */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** What to show the host for a failed request. Our client only throws ApiError. */
export const messageOf = (cause: unknown): string =>
  cause instanceof Error ? cause.message : 'Something went wrong. Please try again.';
