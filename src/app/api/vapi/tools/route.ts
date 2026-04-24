import { after, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { FounderBriefSchema } from "@/lib/models";
import { createRun, getRun } from "@/lib/run-store";
import { runResearchPipeline } from "@/lib/research-pipeline";
import { DEMO_SEEDED_RUN_ID, DEMO_RUN } from "@/lib/fixtures";
import type { MarketAtlas } from "@/lib/models";

interface NormalizedToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

function extractToolCalls(body: unknown): NormalizedToolCall[] {
  const msg = (body as Record<string, unknown>)?.message as Record<string, unknown> | undefined;

  // Format 1: message.toolCallList[]
  if (Array.isArray(msg?.toolCallList)) {
    return (msg.toolCallList as Array<Record<string, unknown>>).map((tc) => ({
      id: String(tc.id ?? ""),
      name: String(tc.name ?? ""),
      args: (() => {
        try {
          return typeof tc.arguments === "string"
            ? (JSON.parse(tc.arguments) as Record<string, unknown>)
            : ((tc.arguments as Record<string, unknown>) ?? {});
        } catch {
          return {};
        }
      })(),
    }));
  }

  // Format 2: message.toolCalls[].function
  if (Array.isArray(msg?.toolCalls)) {
    return (msg.toolCalls as Array<Record<string, unknown>>).map((tc) => {
      const fn = tc.function as Record<string, unknown> | undefined;
      return {
        id: String(tc.id ?? ""),
        name: String(fn?.name ?? tc.name ?? ""),
        args: (() => {
          try {
            const raw = fn?.arguments ?? tc.arguments;
            return typeof raw === "string"
              ? (JSON.parse(raw) as Record<string, unknown>)
              : ((raw as Record<string, unknown>) ?? {});
          } catch {
            return {};
          }
        })(),
      };
    });
  }

  return [];
}

function buildSpokenSummary(atlas: MarketAtlas): string {
  return `Score: ${atlas.score} out of 100. ${atlas.brutal_truth} The strongest wedge: ${atlas.promising_wedge} Next experiment: ${atlas.next_experiment}`.slice(
    0,
    500
  );
}

async function handleStartRealityCheck(
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (process.env.DEMO_MODE === "true") {
    return {
      run_id: DEMO_SEEDED_RUN_ID,
      status: "demo_fallback",
      spoken_summary:
        "Demo mode active. Loading a pre-researched startup reality check now.",
    };
  }

  const parsed = FounderBriefSchema.partial().safeParse(args);
  if (!parsed.success || !parsed.data.idea) {
    return {
      error: "Missing required field: idea",
      spoken_summary: "I need to know your startup idea to start a reality check.",
    };
  }

  const brief = FounderBriefSchema.parse({
    idea: "",
    ...parsed.data,
  });

  const runId = `run_${nanoid(10)}`;
  await createRun(runId, brief);

  after(async () => {
    await runResearchPipeline(runId, brief);
  });

  return {
    run_id: runId,
    status: "running",
    spoken_summary:
      "I'm checking competitors, substitutes, pricing, and user pain now. I'll have results in about 30 seconds.",
  };
}

async function handleGetRealityCheckStatus(
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const runId = String(args.run_id ?? "");

  if (process.env.DEMO_MODE === "true" || runId === DEMO_SEEDED_RUN_ID) {
    return {
      status: "complete",
      run_id: DEMO_SEEDED_RUN_ID,
      spoken_summary: buildSpokenSummary(DEMO_RUN.atlas!),
    };
  }

  if (!runId) {
    return {
      error: "Missing run_id",
      spoken_summary: "I need the run ID to check status.",
    };
  }

  const run = await getRun(runId);
  if (!run) {
    return {
      error: "Run not found",
      spoken_summary: "I couldn't find that reality check. Please start a new one.",
    };
  }

  if (run.status === "complete" && run.atlas) {
    return {
      status: "complete",
      run_id: runId,
      spoken_summary: buildSpokenSummary(run.atlas),
    };
  }

  const eventCount = run.evidence.length;
  return {
    status: run.status,
    run_id: runId,
    evidence_count: eventCount,
    spoken_summary: `Still researching. ${eventCount} evidence points found so far. Check back in a few seconds.`,
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON", retryable: false } },
      { status: 400 }
    );
  }

  // Log every incoming Vapi payload for debugging during hackathon
  console.log("[vapi] incoming:", JSON.stringify(body, null, 2));

  const toolCalls = extractToolCalls(body);
  if (toolCalls.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      let result: Record<string, unknown>;
      try {
        switch (tc.name) {
          case "start_reality_check":
            result = await handleStartRealityCheck(tc.args);
            break;
          case "get_reality_check_status":
            result = await handleGetRealityCheckStatus(tc.args);
            break;
          default:
            result = {
              error: `Unknown tool: ${tc.name}`,
              spoken_summary: "I don't know how to handle that request.",
            };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[vapi] tool handler error for ${tc.name}: ${msg}`);
        result = {
          error: msg,
          spoken_summary: "Something went wrong. Please try again.",
        };
      }

      return { toolCallId: tc.id, result };
    })
  );

  // Always return 200 — Vapi retries on non-200, causing duplicate runs
  return NextResponse.json({ results });
}
