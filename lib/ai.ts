// Resolves the LLM "model" argument for the Vercel AI SDK's generateText().
//
// Two routing paths, chosen automatically:
//   1. ANTHROPIC_API_KEY set  -> call the Anthropic API DIRECTLY via
//      @ai-sdk/anthropic (your own Anthropic account, billed at console.anthropic.com).
//   2. otherwise               -> route through the Vercel AI Gateway using a
//      provider-prefixed string ("anthropic/<model>"), billed via Vercel AI credits.
//
// Get an API key from https://console.anthropic.com (separate from a Claude.ai
// chat subscription) and set ANTHROPIC_API_KEY in the environment to use path 1.
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

// Default model. Override per-feature with AI_ASSISTANT_MODEL / AI_BRIEFING_MODEL.
// Use a bare Anthropic model id (e.g. claude-opus-4-8, claude-sonnet-4-6).
const DEFAULT_MODEL = 'claude-opus-4-8';

export function resolveModel(envModel?: string): LanguageModel {
  const raw = (envModel || DEFAULT_MODEL).trim();
  const bareId = raw.replace(/^anthropic\//, '');

  if (process.env.ANTHROPIC_API_KEY) {
    // Direct to Anthropic with the caller's own key.
    return anthropic(bareId);
  }
  // Fall back to the Vercel AI Gateway (needs the provider prefix + AI credits).
  return raw.includes('/') ? raw : `anthropic/${bareId}`;
}

// True when a direct Anthropic key is configured (handy for status/error copy).
export const usingDirectAnthropic = () => !!process.env.ANTHROPIC_API_KEY;

// Human/string label for the resolved model (resolveModel may return an object),
// e.g. for storing alongside generated content.
export function modelLabel(envModel?: string): string {
  return (envModel || DEFAULT_MODEL).trim().replace(/^anthropic\//, '');
}
