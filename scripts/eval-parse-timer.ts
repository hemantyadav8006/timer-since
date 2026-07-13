/**
 * Lightweight AI eval for parse-timer.
 *
 * Offline (always):
 *   - Golden case shape checks
 *   - Prompt length gate checks
 *   - Zod schema round-trip on sample drafts
 *
 * Live (when GOOGLE_GENERATIVE_AI_API_KEY is set):
 *   - Calls parseTimerFromPrompt for non-reject cases
 *   - Asserts mode/category/sound/date/milestone expectations
 *
 * Usage: npm run eval:ai
 */

import {
  PARSE_TIMER_MAX_PROMPT_CHARS,
  PARSE_TIMER_MIN_PROMPT_CHARS,
} from "@/lib/ai/constants";
import {
  TIMER_CATEGORIES,
  TIMER_SOUNDS,
  TIMER_MODES,
  timerDraftSchema,
  draftToCreatePayload,
  type TimerDraft,
} from "@/lib/ai/schema";
import { GOLDEN_CASES, type GoldenCase } from "@/lib/ai/eval/golden-cases";

type CheckResult = { id: string; ok: boolean; detail: string };

function assertOfflineCase(c: GoldenCase): CheckResult[] {
  const results: CheckResult[] = [];
  const len = c.prompt.length;

  if (c.expect.expectClientReject === "too_long") {
    results.push({
      id: `${c.id}:length`,
      ok: len > PARSE_TIMER_MAX_PROMPT_CHARS,
      detail: `len=${len} max=${PARSE_TIMER_MAX_PROMPT_CHARS}`,
    });
    return results;
  }

  if (c.expect.expectClientReject === "too_short") {
    results.push({
      id: `${c.id}:length`,
      ok: len < PARSE_TIMER_MIN_PROMPT_CHARS,
      detail: `len=${len} min=${PARSE_TIMER_MIN_PROMPT_CHARS}`,
    });
    return results;
  }

  results.push({
    id: `${c.id}:prompt-nonempty`,
    ok: len >= PARSE_TIMER_MIN_PROMPT_CHARS,
    detail: `len=${len}`,
  });

  return results;
}

function checkDraftAgainstCase(
  c: GoldenCase,
  draft: TimerDraft,
  nowMs: number,
): CheckResult[] {
  const results: CheckResult[] = [];
  const e = c.expect;

  if (e.mode) {
    results.push({
      id: `${c.id}:mode`,
      ok: draft.mode === e.mode,
      detail: `got=${draft.mode} want=${e.mode}`,
    });
  }

  if (e.category) {
    results.push({
      id: `${c.id}:category`,
      ok: draft.category === e.category,
      detail: `got=${draft.category} want=${e.category}`,
    });
  }

  if (e.sound) {
    results.push({
      id: `${c.id}:sound`,
      ok: draft.sound === e.sound,
      detail: `got=${draft.sound} want=${e.sound}`,
    });
  }

  if (e.titleIncludes?.length) {
    const title = draft.title.toLowerCase();
    const hit = e.titleIncludes.some((s) => title.includes(s.toLowerCase()));
    results.push({
      id: `${c.id}:title`,
      ok: hit,
      detail: `title="${draft.title}" includesOneOf=${e.titleIncludes.join("|")}`,
    });
  }

  if (e.startBeforeNow) {
    results.push({
      id: `${c.id}:startBeforeNow`,
      ok: draft.startDate <= nowMs + 60_000,
      detail: `startDate=${draft.startDate} now=${nowMs}`,
    });
  }

  if (e.targetAfterNow) {
    results.push({
      id: `${c.id}:targetAfterNow`,
      ok:
        draft.targetDate != null &&
        Number.isFinite(draft.targetDate) &&
        draft.targetDate > nowMs,
      detail: `targetDate=${draft.targetDate} now=${nowMs}`,
    });
  }

  if (e.minMilestones != null) {
    results.push({
      id: `${c.id}:milestones`,
      ok: draft.milestones.length >= e.minMilestones,
      detail: `count=${draft.milestones.length} min=${e.minMilestones}`,
    });
  }

  if (e.forbidCategory?.length) {
    results.push({
      id: `${c.id}:forbidCategory`,
      ok: !e.forbidCategory.includes(draft.category),
      detail: `category=${draft.category}`,
    });
  }

  // Always: enums must be legal
  results.push({
    id: `${c.id}:enum-category`,
    ok: (TIMER_CATEGORIES as readonly string[]).includes(draft.category),
    detail: draft.category,
  });
  results.push({
    id: `${c.id}:enum-mode`,
    ok: (TIMER_MODES as readonly string[]).includes(draft.mode),
    detail: draft.mode,
  });
  results.push({
    id: `${c.id}:enum-sound`,
    ok: (TIMER_SOUNDS as readonly string[]).includes(draft.sound),
    detail: draft.sound,
  });

  const zodOk = timerDraftSchema.safeParse(draft).success;
  results.push({
    id: `${c.id}:zod`,
    ok: zodOk,
    detail: zodOk ? "ok" : "schema failed",
  });

  const payload = draftToCreatePayload(draft);
  results.push({
    id: `${c.id}:payload-title`,
    ok: Boolean(payload.title?.trim()),
    detail: payload.title,
  });

  return results;
}

function sampleDraftRoundTrip(): CheckResult[] {
  const now = Date.now();
  const sample: TimerDraft = {
    title: "Sample",
    description: "",
    icon: "⏱️",
    color: "#00FF88",
    category: "personal",
    tags: ["test"],
    mode: "elapsed",
    startDate: now - 86_400_000,
    targetDate: null,
    sound: "none",
    milestones: [{ label: "1 Day", durationMs: 86_400_000, icon: "📌" }],
    assumptions: ["test"],
    confidence: "high",
  };
  const parsed = timerDraftSchema.safeParse(sample);
  return [
    {
      id: "schema:roundtrip",
      ok: parsed.success,
      detail: parsed.success ? "ok" : JSON.stringify(parsed.error?.issues),
    },
    {
      id: "meta:golden-count",
      ok: GOLDEN_CASES.length >= 10,
      detail: `count=${GOLDEN_CASES.length}`,
    },
  ];
}

async function main() {
  const results: CheckResult[] = [...sampleDraftRoundTrip()];

  for (const c of GOLDEN_CASES) {
    results.push(...assertOfflineCase(c));
  }

  const live = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
  if (live) {
    const { parseTimerFromPrompt } = await import("@/lib/ai/parse-timer");
    const nowMs = Date.now();
    for (const c of GOLDEN_CASES) {
      if (c.expect.expectClientReject) continue;
      try {
        const result = await parseTimerFromPrompt(c.prompt, { nowMs });
        results.push(...checkDraftAgainstCase(c, result.draft, nowMs));
        results.push({
          id: `${c.id}:live`,
          ok: true,
          detail: `latencyMs=${result.latencyMs} tokens=${result.usage.totalTokens}`,
        });
      } catch (err) {
        results.push({
          id: `${c.id}:live`,
          ok: false,
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } else {
    console.log(
      "GOOGLE_GENERATIVE_AI_API_KEY not set — skipping live LLM eval (offline checks only).\n",
    );
  }

  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? "PASS" : "FAIL";
    if (r.ok) passed++;
    else failed++;
    console.log(`${mark}  ${r.id}  ${r.detail}`);
  }

  console.log(
    `\n${passed} passed, ${failed} failed (${results.length} checks). Live=${live}`,
  );

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
