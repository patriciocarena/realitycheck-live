import { after, NextResponse } from "next/server";
import { getRun } from "@/lib/run-store";
import { runResearchPipeline } from "@/lib/research-pipeline";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const run = await getRun(runId);
  if (!run) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Run not found", retryable: false } },
      { status: 404 }
    );
  }

  after(async () => {
    await runResearchPipeline(runId, run.brief);
  });

  return NextResponse.json({ run_id: runId, status: "research_started" });
}
