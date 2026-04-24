import OpenAI from "openai";
import { MarketAtlasSchema } from "./models";
import { getRun, setAtlas, updateRunStatus, appendEvent } from "./run-store";
import type { MarketAtlas, Run } from "./models";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    // Support OpenAI or Kimi (OpenAI-compatible)
    const kimiKey = process.env.KIMI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (kimiKey) {
      openaiClient = new OpenAI({
        apiKey: kimiKey,
        baseURL: "https://api.moonshot.cn/v1",
      });
    } else {
      openaiClient = new OpenAI({ apiKey: openaiKey });
    }
  }
  return openaiClient;
}

function getLLMModel(): string {
  return process.env.KIMI_API_KEY ? "moonshot-v1-8k" : "gpt-4o-mini";
}

function hasLLMKey(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.KIMI_API_KEY);
}

const SYSTEM_PROMPT = `You are a brutally honest startup validation analyst.
Given the founder brief and source-linked evidence, produce a concise market atlas.
Do not flatter the founder. Every major claim must be supported by an evidence id.
If evidence is weak, say so clearly. Return strict JSON matching the schema exactly.

The JSON must have these fields:
- one_line_thesis (string)
- score (number 0-100)
- brutal_truth (string)
- promising_wedge (string)
- target_icp (string)
- competitors (array of {name, url, notes})
- substitutes (array of strings)
- risks (array of strings)
- next_experiment (string, doable in 7 days, measurable)
- evidence_ids (array of evidence id strings)`;

function buildUserMessage(run: Run): string {
  const evidenceLines = run.evidence.map(
    (e) => `[${e.id}] ${e.evidence_type} | confidence:${e.confidence} | ${e.url}\n  claim: ${e.claim}`
  );

  return `FOUNDER BRIEF:\n${JSON.stringify(run.brief, null, 2)}\n\nEVIDENCE (${run.evidence.length} items):\n${evidenceLines.join("\n\n")}`;
}

function buildFallbackAtlas(run: Run): MarketAtlas {
  const competitors = run.evidence
    .filter((e) => e.evidence_type === "competitor")
    .map((e) => ({ name: e.title.slice(0, 40), url: e.url, notes: e.claim.slice(0, 100) }));

  const substitutes = run.evidence
    .filter((e) => e.evidence_type === "substitute")
    .map((e) => e.claim.slice(0, 100));

  return {
    one_line_thesis: `Market research for: ${run.brief.idea}`,
    score: 50,
    brutal_truth:
      "Automated synthesis failed or produced invalid output. Evidence was collected but could not be synthesized. Manual review recommended.",
    promising_wedge: run.brief.idea,
    target_icp: run.brief.target_user,
    competitors: competitors.slice(0, 3),
    substitutes: substitutes.slice(0, 3),
    risks: ["Synthesis failed — manual validation required"],
    next_experiment: "Review collected evidence manually and run synthesis again",
    evidence_ids: run.evidence.map((e) => e.id),
  };
}

async function callLLM(run: Run): Promise<string | null> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: getLLMModel(),
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(run) },
      ],
    });
    return response.choices[0]?.message?.content ?? null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[synthesis] LLM call failed: ${msg}`);
    return null;
  }
}

async function repairSynthesis(run: Run, badJson: string): Promise<MarketAtlas | null> {
  try {
    const openai = getOpenAI();
    const repairPrompt = `The previous response was invalid or failed schema validation.
Here is the original output: ${badJson.slice(0, 2000)}
Please return a corrected version as strict JSON with fields: one_line_thesis, score (0-100), brutal_truth, promising_wedge, target_icp, competitors (array of {name,url,notes}), substitutes (array of strings), risks (array of strings), next_experiment, evidence_ids (array of strings).`;

    const response = await openai.chat.completions.create({
      model: getLLMModel(),
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: repairPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = MarketAtlasSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function runSynthesis(runId: string): Promise<MarketAtlas | null> {
  const run = await getRun(runId);
  if (!run) return null;

  await appendEvent(runId, {
    type: "synthesis_started",
    message: `${run.evidence.length} evidence items collected. Starting LLM market atlas synthesis.`,
    sponsor: "llm",
  });

  if (!hasLLMKey()) {
    console.warn("[synthesis] No LLM key set — using fallback atlas");
    const atlas = buildFallbackAtlas(run);
    await setAtlas(runId, atlas);
    await updateRunStatus(runId, "complete");
    await appendEvent(runId, {
      type: "complete",
      message: `Market atlas complete (fallback). Score: ${atlas.score}/100.`,
      sponsor: "app",
    });
    return atlas;
  }

  const rawContent = await callLLM(run);
  let atlas: MarketAtlas | null = null;

  if (rawContent) {
    try {
      const parsed = MarketAtlasSchema.safeParse(JSON.parse(rawContent));
      if (parsed.success) {
        atlas = parsed.data;
      } else {
        console.warn("[synthesis] schema validation failed, attempting repair");
        atlas = await repairSynthesis(run, rawContent);
      }
    } catch {
      atlas = await repairSynthesis(run, rawContent ?? "");
    }
  }

  if (!atlas) {
    console.warn("[synthesis] repair failed — using deterministic fallback");
    atlas = buildFallbackAtlas(run);
    await setAtlas(runId, atlas);
    await updateRunStatus(runId, "complete");
    await appendEvent(runId, {
      type: "complete",
      message: `Market atlas complete (fallback). Score: ${atlas.score}/100.`,
      sponsor: "app",
    });
    return atlas;
  }

  await setAtlas(runId, atlas);
  await updateRunStatus(runId, "complete");
  await appendEvent(runId, {
    type: "complete",
    message: `Market atlas complete. Score: ${atlas.score}/100.`,
    sponsor: "llm",
  });

  return atlas;
}
