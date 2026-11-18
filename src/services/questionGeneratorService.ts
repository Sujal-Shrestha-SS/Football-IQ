import { AnyQuestion, GameModeId } from '../types/football';

const SEEN_ANSWERS_KEY_PREFIX = 'fiq_seen_answers_';

// Deduplicate concurrent requests for the same mode-count
const inFlightRequests = new Map<string, Promise<AnyQuestion[] | null>>();

let quotaCooldownUntil = 0;

export function isQuestionGenQuotaCoolingDown(): boolean {
  return Date.now() < quotaCooldownUntil;
}

export function getSeenAnswers(mode: GameModeId): string[] {
  try {
    const raw = sessionStorage.getItem(`${SEEN_ANSWERS_KEY_PREFIX}${mode}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function recordSeenAnswers(mode: GameModeId, questions: AnyQuestion[]): void {
  try {
    const existing = getSeenAnswers(mode);
    const merged = [...existing];
    const set = new Set(existing.map((a) => a.toLowerCase()));
    for (const q of questions) {
      const ans = String(q?.correctAnswer || '').trim();
      if (ans && !set.has(ans.toLowerCase())) {
        set.add(ans.toLowerCase());
        merged.push(ans);
      }
    }
    // Keep last 45 answers per mode so prompt stays compact and focused
    const trimmed = merged.slice(-45);
    sessionStorage.setItem(`${SEEN_ANSWERS_KEY_PREFIX}${mode}`, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Generates fresh post-2010 expert questions via the server-side Gemini endpoint.
 * Always requests a unique batch on each match, excluding recently seen answers.
 * Falls back silently to null on error, quota cooldown, or timeout so caller uses unseen seed questions.
 */
export async function generateQuestions(
  mode: GameModeId,
  count: number
): Promise<AnyQuestion[] | null> {
  if (mode === 'tictactoe') return null;

  if (isQuestionGenQuotaCoolingDown()) {
    return null;
  }

  const requestKey = `${mode}-${count}`;
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const excludeAnswers = getSeenAnswers(mode);

  const requestPromise = (async (): Promise<AnyQuestion[] | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    try {
    const base = import.meta.env.VITE_API_URL ?? '';
    const response = await fetch(`${base}/api/questions/generate`, {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          count,
          excludeAnswers,
          nonce: Date.now(),
        }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        quotaCooldownUntil = Date.now() + 90 * 1000;
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
        id: q.id || `${mode}-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
        mode,
        difficulty: 'expert' as const,
      })) as AnyQuestion[];

      return withIds;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
      inFlightRequests.delete(requestKey);
    }
  })();

  inFlightRequests.set(requestKey, requestPromise);
  return requestPromise;
}

export async function prewarmCache(_mode: GameModeId, _count: number): Promise<void> {
  // No-op: questions are generated fresh per match to avoid repeats and save quota
}
