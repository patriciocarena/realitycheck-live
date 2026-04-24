import { nanoid } from "nanoid";
import { getRedis } from "./redis";
import type {
  FounderBrief,
  Run,
  RunEvent,
  RunStatus,
  Evidence,
  MarketAtlas,
} from "./models";

const TTL = 86400;

const k = {
  run: (id: string) => `rcl:run:${id}`,
  events: (id: string) => `rcl:run:${id}:events`,
  evidenceList: (id: string) => `rcl:run:${id}:evidence`,
  evidence: (id: string) => `rcl:evidence:${id}`,
  atlas: (id: string) => `rcl:run:${id}:atlas`,
  searchCache: (hash: string) => `rcl:cache:search:${hash}`,
};

// In-memory fallback — stored on globalThis so it survives HMR in dev mode
declare global {
  // eslint-disable-next-line no-var
  var __rcl_mem: Map<string, string> | undefined;
  // eslint-disable-next-line no-var
  var __rcl_lists: Map<string, string[]> | undefined;
}
const mem: Map<string, string> = globalThis.__rcl_mem ?? new Map();
const memLists: Map<string, string[]> = globalThis.__rcl_lists ?? new Map();
globalThis.__rcl_mem = mem;
globalThis.__rcl_lists = memLists;

function hasRedis(): boolean {
  return !!process.env.REDIS_URL;
}

async function mGet(key: string): Promise<string | null> {
  if (hasRedis()) {
    try { return await getRedis().get(key); } catch { return mem.get(key) ?? null; }
  }
  return mem.get(key) ?? null;
}

async function mSet(key: string, value: string): Promise<void> {
  mem.set(key, value);
  if (hasRedis()) {
    try { await getRedis().set(key, value, "EX", TTL); } catch { /* fallback already set */ }
  }
}

async function lPush(key: string, value: string): Promise<void> {
  const list = memLists.get(key) ?? [];
  list.push(value);
  memLists.set(key, list);
  if (hasRedis()) {
    try {
      await getRedis().rpush(key, value);
      await getRedis().expire(key, TTL);
    } catch { /* fallback already set */ }
  }
}

async function lRange(key: string): Promise<string[]> {
  if (hasRedis()) {
    try { return await getRedis().lrange(key, 0, -1); } catch {}
  }
  return memLists.get(key) ?? [];
}

export async function createRun(runId: string, brief: FounderBrief): Promise<void> {
  const meta = { run_id: runId, status: "queued" as RunStatus, brief };
  await mSet(k.run(runId), JSON.stringify(meta));

  const event: RunEvent = {
    id: `evt_${nanoid(8)}`,
    run_id: runId,
    type: "created",
    message: "Run created",
    sponsor: "app",
    created_at: new Date().toISOString(),
  };
  await lPush(k.events(runId), JSON.stringify(event));
}

export async function getRun(runId: string): Promise<Run | null> {
  const metaRaw = await mGet(k.run(runId));
  if (!metaRaw) return null;

  let meta: { run_id: string; status: RunStatus; brief: FounderBrief };
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return null;
  }

  const eventsRaw = await lRange(k.events(runId));
  const evidenceIds = await lRange(k.evidenceList(runId));
  const atlasRaw = await mGet(k.atlas(runId));

  const events: RunEvent[] = eventsRaw.flatMap((raw) => {
    try { return [JSON.parse(raw) as RunEvent]; } catch { return []; }
  });

  let evidence: Evidence[] = [];
  if (evidenceIds.length > 0) {
    const fetched = await Promise.all(evidenceIds.map((id) => mGet(k.evidence(id))));
    evidence = fetched.flatMap((raw) => {
      if (!raw) return [];
      try { return [JSON.parse(raw) as Evidence]; } catch { return []; }
    });
  }

  let atlas: MarketAtlas | null = null;
  if (atlasRaw) {
    try { atlas = JSON.parse(atlasRaw); } catch {}
  }

  return { run_id: meta.run_id, status: meta.status, brief: meta.brief, events, evidence, atlas };
}

export async function updateRunStatus(runId: string, status: RunStatus): Promise<void> {
  const raw = await mGet(k.run(runId));
  if (!raw) return;
  try {
    const meta = JSON.parse(raw);
    meta.status = status;
    await mSet(k.run(runId), JSON.stringify(meta));
  } catch { /* ignore */ }
}

export async function appendEvent(
  runId: string,
  partial: Omit<RunEvent, "id" | "run_id" | "created_at">
): Promise<void> {
  const event: RunEvent = {
    id: `evt_${nanoid(8)}`,
    run_id: runId,
    created_at: new Date().toISOString(),
    ...partial,
  };
  await lPush(k.events(runId), JSON.stringify(event));
}

export async function storeEvidence(evidence: Evidence): Promise<void> {
  await mSet(k.evidence(evidence.id), JSON.stringify(evidence));
  await lPush(k.evidenceList(evidence.run_id), evidence.id);
}

export async function setAtlas(runId: string, atlas: MarketAtlas): Promise<void> {
  await mSet(k.atlas(runId), JSON.stringify(atlas));
}

export async function getCachedSearch(hash: string): Promise<unknown | null> {
  const raw = await mGet(k.searchCache(hash));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function setCachedSearch(hash: string, data: unknown): Promise<void> {
  await mSet(k.searchCache(hash), JSON.stringify(data));
}
