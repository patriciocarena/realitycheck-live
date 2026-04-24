---
name: realitycheck-live
description: Run a voice-first startup idea reality check with live web research, Redis memory, and Vapi tool calls.
license: MIT
compatibility: Requires network access, TinyFish API key, Vapi API key, Redis, OpenAI API key, and a public HTTPS endpoint for Vapi tools.
metadata:
  author: alejandrospot2
  version: "1.0.0"
---

# RealityCheck Live

## When To Use

Use this skill when a founder wants to turn a spoken startup idea into a source-cited market thesis — without filling out forms or building a deck. The agent conducts a live market reality check over voice and returns a scored Market Atlas with competitors, substitutes, risks, and a 7-day next experiment.

## Workflow

1. **Voice intake** — Vapi assistant asks the founder for their idea, target user, current alternatives, and biggest risk.
2. **Create founder brief** — normalize spoken input into a structured FounderBrief object via `start_reality_check` tool call.
3. **Launch research** — trigger 5-lane TinyFish research in parallel: competitors, substitutes, pain signals, pricing, and why-now timing.
4. **Store state in Redis** — persist run metadata, evidence, and progress events throughout the pipeline.
5. **Synthesize market atlas** — OpenAI gpt-4o-mini produces a brutally honest MarketAtlas JSON validated with Zod.
6. **Return verdict** — dashboard updates in real time; Vapi speaks a crisp 80-word summary back to the founder.
7. **Persist for recall** — final atlas and all evidence stored in Redis with 24h TTL for dashboard access.

## Required Tools

| Tool | Purpose |
|------|---------|
| Vapi | Voice conversation + custom tool calls (`start_reality_check`, `get_reality_check_status`) |
| TinyFish Search API | Competitor and substitute discovery across the web |
| TinyFish Fetch API | Clean text extraction from high-value source URLs |
| Redis | Run state, event timeline, evidence store, search cache, final atlas |
| OpenAI | LLM synthesis of evidence into a scored Market Atlas |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TINYFISH_API_KEY` | Yes | TinyFish API key for live web research |
| `VAPI_API_KEY` | Yes | Vapi API key for assistant setup and calls |
| `VAPI_ASSISTANT_ID` | No | Pre-created Vapi assistant ID |
| `REDIS_URL` | Yes | Redis connection URL (`redis://...`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for synthesis |
| `APP_BASE_URL` | Yes | Public HTTPS base URL (required for Vapi tool endpoint) |
| `DEMO_MODE` | No | Set to `"true"` to return fixture data without live API calls |
| `DEMO_SEEDED_RUN_ID` | No | Fixture run ID returned in demo mode (`run_demo_001`) |

## API Endpoints

- `POST /api/vapi/tools` — Vapi tool call handler
- `POST /api/runs` — Create a new run
- `GET /api/runs/:runId` — Get full run state (brief, events, evidence, atlas)
- `POST /api/runs/:runId/research` — Trigger research pipeline
- `POST /api/runs/:runId/synthesize` — Trigger LLM synthesis
- `GET /api/health` — Health check (includes Redis ping)

## Common Mistakes

- Do not generate generic advice without source URLs — every claim in the atlas must be tied to an evidence ID.
- Do not skip the substitutes lane — judges and founders both want to know what users do today, not just competitors.
- Do not let Vapi responses exceed 25 words during intake — short responses keep the voice conversation natural.
- Always return HTTP 200 from `/api/vapi/tools` — Vapi retries on non-200, causing duplicate runs.
- Echo back the exact `toolCallId` from the incoming Vapi payload — mismatched IDs silently drop results.

## Fallback Strategy

If TinyFish, OpenAI, or Redis are unavailable:
- TinyFish unavailable: return fixture evidence from `src/lib/fixtures.ts`, labeled as demo mode.
- OpenAI unavailable: use deterministic fallback atlas built from collected evidence.
- Redis unavailable: log error and return a graceful failure response — do not crash.
- Set `DEMO_MODE=true` for a fully self-contained demo with no live API calls.
