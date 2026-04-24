import { after, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { FounderBriefSchema } from "@/lib/models";
import { createRun } from "@/lib/run-store";
import { runResearchPipeline } from "@/lib/research-pipeline";
import { DEMO_SEEDED_RUN_ID, DEMO_RUN } from "@/lib/fixtures";

export async function POST(req: Request) {
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json(
      { run_id: DEMO_SEEDED_RUN_ID, status: DEMO_RUN.status },
      { status: 201 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body", retryable: false } },
      { status: 400 }
    );
  }

  const parsed = FounderBriefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.message, retryable: false } },
      { status: 400 }
    );
  }

  const brief = parsed.data;
  const runId = `run_${nanoid(10)}`;

  await createRun(runId, brief);

  after(async () => {
    await runResearchPipeline(runId, brief);
  });

  return NextResponse.json({ run_id: runId, status: "queued" }, { status: 201 });
}
