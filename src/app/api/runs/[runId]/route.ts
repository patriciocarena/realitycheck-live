import { NextResponse } from "next/server";
import { getRun } from "@/lib/run-store";
import { DEMO_SEEDED_RUN_ID, DEMO_RUN } from "@/lib/fixtures";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  if (process.env.DEMO_MODE === "true" && runId === DEMO_SEEDED_RUN_ID) {
    return NextResponse.json(DEMO_RUN);
  }

  const run = await getRun(runId);
  if (!run) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Run not found", retryable: false } },
      { status: 404 }
    );
  }

  return NextResponse.json(run);
}
