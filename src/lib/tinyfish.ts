import { nanoid } from "nanoid";
import { getCachedSearch, setCachedSearch } from "./run-store";
import { DEMO_EVIDENCE_LIST } from "./fixtures";
import type { Evidence, EvidenceType } from "./models";

const SEARCH_URL = "https://api.search.tinyfish.ai";
const FETCH_URL = "https://api.fetch.tinyfish.ai";
const TIMEOUT_MS = 10_000;

export function hashQuery(q: string): string {
  return Buffer.from(q.toLowerCase().trim()).toString("base64url").slice(0, 20);
}

function makeAbortSignal(): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), TIMEOUT_MS);
  return controller.signal;
}

function getApiKey(): string | undefined {
  return process.env.TINYFISH_API_KEY;
}

export async function tinyfishSearch(
  query: string,
  runId: string,
  evidenceType: EvidenceType
): Promise<Evidence[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[tinyfish] TINYFISH_API_KEY not set — returning fixture fallback");
    return DEMO_EVIDENCE_LIST.filter((e) => e.evidence_type === evidenceType)
      .slice(0, 3)
      .map((e) => ({ ...e, run_id: runId, id: `ev_${nanoid(8)}` }));
  }

  const hash = hashQuery(query);
  const cached = await getCachedSearch(hash).catch(() => null);
  if (cached) {
    console.log(`[tinyfish] cache hit for query hash ${hash}`);
    return mapSearchResults(cached, runId, evidenceType);
  }

  try {
    const url = `${SEARCH_URL}?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "X-API-Key": apiKey },
      signal: makeAbortSignal(),
    });

    if (!res.ok) {
      console.error(`[tinyfish] search non-200: ${res.status}`);
      return [];
    }

    const data: unknown = await res.json();
    await setCachedSearch(hash, data).catch(() => {});
    return mapSearchResults(data, runId, evidenceType);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[tinyfish] search error for "${query}": ${msg}`);
    return [];
  }
}

function mapSearchResults(data: unknown, runId: string, evidenceType: EvidenceType): Evidence[] {
  const items = (data as { results?: unknown[] })?.results ?? (Array.isArray(data) ? data : []);
  return (items as Array<Record<string, unknown>>).slice(0, 5).map((item) => {
    const snippet = String(item.snippet ?? item.description ?? "").slice(0, 500);
    return {
      id: `ev_${nanoid(8)}`,
      run_id: runId,
      url: String(item.url ?? ""),
      title: String(item.title ?? ""),
      snippet,
      claim: snippet.split(".")[0] ?? snippet.slice(0, 120),
      evidence_type: evidenceType,
      confidence: snippet.length > 50 ? 0.75 : 0.5,
      source_tool: "tinyfish_search" as const,
    };
  });
}

export async function tinyfishFetch(
  url: string,
  runId: string,
  evidenceType: EvidenceType
): Promise<Evidence | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(FETCH_URL, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
      signal: makeAbortSignal(),
    });

    if (!res.ok) {
      console.error(`[tinyfish] fetch non-200: ${res.status} for ${url}`);
      return null;
    }

    const data = (await res.json()) as Record<string, unknown>;
    const content = String(data.content ?? data.text ?? "").slice(0, 800);
    const title = String(data.title ?? url);
    const claim = content.split(".").find((s) => s.trim().length > 20) ?? content.slice(0, 120);

    return {
      id: `ev_${nanoid(8)}`,
      run_id: runId,
      url,
      title,
      snippet: content,
      claim: claim.trim(),
      evidence_type: evidenceType,
      confidence: 0.85,
      source_tool: "tinyfish_fetch" as const,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[tinyfish] fetch error for ${url}: ${msg}`);
    return null;
  }
}
