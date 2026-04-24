import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function GET() {
  try {
    await getRedis().ping();
    return NextResponse.json({ status: "ok", redis: "ok", ts: Date.now() });
  } catch {
    return NextResponse.json({ status: "degraded", redis: "error", ts: Date.now() });
  }
}
