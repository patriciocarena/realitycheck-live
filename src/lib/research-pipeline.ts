import { tinyfishSearch, tinyfishFetch } from "./tinyfish";
import { appendEvent, storeEvidence, updateRunStatus } from "./run-store";
import { runSynthesis } from "./synthesis";
import type { Evidence, EvidenceType, FounderBrief } from "./models";

interface Lane {
  query: string;
  evidenceType: EvidenceType;
}

function buildLanes(brief: FounderBrief): Lane[] {
  return [
    {
      query: `${brief.idea} startup validation voice agent competitors pricing`,
      evidenceType: "competitor",
    },
    {
      query: `how do ${brief.target_user} validate startup ideas today reddit product hunt indie hackers`,
      evidenceType: "substitute",
    },
    {
      query: `${brief.target_user} wasted months building wrong startup idea problem validation`,
      evidenceType: "pain",
    },
    {
      query: `startup idea validation software pricing founder coaching AI market research pricing`,
      evidenceType: "pricing",
    },
    {
      query: `voice AI agents founders market research trend 2026`,
      evidenceType: "why_now",
    },
  ];
}

async function runLane(runId: string, lane: Lane): Promise<void> {
  const searchResults = await tinyfishSearch(lane.query, runId, lane.evidenceType);

  // Fetch top 2 URLs for richer content
  const topUrls = searchResults.slice(0, 2).map((e) => e.url).filter(Boolean);
  const fetchResults = await Promise.all(
    topUrls.map((url) => tinyfishFetch(url, runId, lane.evidenceType))
  );

  // Merge: search results + fetched items, deduplicate by URL
  const seen = new Set<string>();
  const allEvidence: Evidence[] = [];

  for (const ev of [...searchResults, ...fetchResults.filter(Boolean) as Evidence[]]) {
    if (!seen.has(ev.url)) {
      seen.add(ev.url);
      allEvidence.push(ev);
    }
  }

  for (const ev of allEvidence) {
    await storeEvidence(ev);
    await appendEvent(runId, {
      type: "evidence_found",
      message: `Found ${lane.evidenceType} evidence: ${ev.title.slice(0, 60)}`,
      sponsor: "tinyfish",
    });
  }
}

export async function runResearchPipeline(runId: string, brief: FounderBrief): Promise<void> {
  try {
    await appendEvent(runId, {
      type: "research_started",
      message: "Launching 5 research lanes: competitors, substitutes, pain, pricing, why_now",
      sponsor: "tinyfish",
    });
    await updateRunStatus(runId, "running");

    const lanes = buildLanes(brief);
    await Promise.all(lanes.map((lane) => runLane(runId, lane)));

    await updateRunStatus(runId, "partial");
    await runSynthesis(runId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[pipeline] unhandled error for run ${runId}: ${msg}`);
    await appendEvent(runId, {
      type: "failed",
      message: `Pipeline error: ${msg}`,
      sponsor: "app",
    }).catch(() => {});
    await updateRunStatus(runId, "failed").catch(() => {});
  }
}
