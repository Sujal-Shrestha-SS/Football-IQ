import { AnyQuestion, GameModeId } from '../types/football';

// In-memory session cache: keyed by "mode-count", cleared on page reload
const sessionCache = new Map<string, AnyQuestion[]>();
// Deduplicate concurrent requests for the same mode-count
const inFlightRequests = new Map<string, Promise<AnyQuestion[] | null>>();

let quotaCooldownUntil = 0;

export function isQuestionGenQuotaCoolingDown(): boolean {
  return Date.now() < quotaCooldownUntil;
}

/**
 * Generates fresh post-2010 expert questions via the server-side Gemini endpoint.
 * Falls back silently to null on error, quota cooldown, or timeout so caller uses the static seed bank.
 */
export async function generateQuestions(
  mode: GameModeId,
  count: number
): Promise<AnyQuestion[] | null> {
  if (mode === 'tictactoe') return null;

  const cacheKey = `${mode}-${count}`;
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey)!;
  }

  if (isQuestionGenQuotaCoolingDown()) {
    return null;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const requestPromise = (async (): Promise<AnyQuestion[] | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, count }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        quotaCooldownUntil = Date.now() + 10 * 60 * 1000;
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { questions?: AnyQuestion[] };
      const parsed = data?.questions;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return null;
      }

      const validated = parsed.filter(
        (q) =>
          q &&
          typeof q.question === 'string' &&
          typeof q.correctAnswer === 'string' &&
          q.correctAnswer.trim().length > 0
      );

      if (validated.length === 0) {
        return null;
      }

      const withIds = validated.map((q, i) => ({
        ...q,
        id: q.id || `${mode}-gen-${Date.now()}-${i}`,
        mode,
        difficulty: 'expert' as const,
      })) as AnyQuestion[];

      sessionCache.set(cacheKey, withIds);
      return withIds;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/** Pre-warms the in-memory session cache for a mode so its first launch is instant. */
export async function prewarmCache(mode: GameModeId, count: number): Promise<void> {
  await generateQuestions(mode, count);
}
