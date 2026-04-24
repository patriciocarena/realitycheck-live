# RealityCheck Live — Agent Workflow

## Overview

RealityCheck Live turns a spoken startup pitch into a source-cited market thesis using a 5-lane research pipeline.

## 8-Step Agent Loop

### Step 1: Voice Intake (Vapi)
- Founder calls or uses web call interface
- Vapi assistant asks: idea, target user, current alternative, why now, biggest risk
- Keep each response under 25 words to maintain voice flow
- Vapi calls `start_reality_check` tool once enough context is gathered

### Step 2: Normalize to FounderBrief
- `POST /api/vapi/tools` receives the tool call
- Parses args with `FounderBriefSchema.partial()` — only `idea` is required
- Creates a structured FounderBrief object

### Step 3: Create Run + Store in Redis
- Generate `run_${nanoid(10)}` ID
- `createRun()` writes to `rcl:run:{runId}` with status `queued`
- Appends `created` event to `rcl:run:{runId}:events`
- Returns `run_id` to Vapi immediately

### Step 4: Background Research (TinyFish, 5 lanes in parallel)
- Triggered via `after()` — runs after HTTP response is sent
- 5 lanes run concurrently with `Promise.all`:
  1. **Competitors**: `"${idea} startup validation voice agent competitors pricing"`
  2. **Substitutes**: `"how do ${target_user} validate startup ideas today reddit"`
  3. **Pain**: `"${target_user} wasted months building wrong startup idea"`
  4. **Pricing**: `"startup idea validation software pricing AI market research"`
  5. **Why Now**: `"voice AI agents founders market research trend 2026"`
- Per lane: TinyFish Search (up to 5 results) + TinyFish Fetch on top 2 URLs

### Step 5: Store Evidence in Redis
- Each evidence item: `SET rcl:evidence:{id}`, `RPUSH rcl:run:{runId}:evidence {id}`
- Event appended: `evidence_found` with sponsor `tinyfish`
- All keys set with 24h TTL

### Step 6: LLM Synthesis
- Load run + all evidence from Redis
- Call OpenAI gpt-4o-mini with `response_format: json_object`
- Parse with `MarketAtlasSchema.safeParse()`
- On failure: retry once with repair prompt, fall back to deterministic template

### Step 7: Store Atlas in Redis
- `SET rcl:run:{runId}:atlas` with the final MarketAtlas JSON
- `updateRunStatus()` → `complete`
- Append `complete` event with sponsor `llm`

### Step 8: Dashboard + Vapi Response
- Frontend polls `GET /api/runs/:runId` for status updates
- When founder calls `get_reality_check_status`, Vapi speaks an 80-word summary
- Dashboard shows full evidence feed, competitor list, brutal truth, wedge, next experiment

## Redis Key Schema

```
rcl:run:{runId}              → JSON { run_id, status, brief }
rcl:run:{runId}:events       → List of JSON RunEvent strings
rcl:run:{runId}:evidence     → List of evidence ID strings
rcl:evidence:{evidenceId}    → JSON Evidence object
rcl:run:{runId}:atlas        → JSON MarketAtlas
rcl:cache:search:{hash}      → cached TinyFish search result (1h TTL)
```

## Failure Modes

| Failure | Behavior |
|---------|---------|
| TinyFish unavailable | Return fixture evidence, label as demo mode |
| TinyFish timeout | AbortController at 10s, return empty array, continue pipeline |
| OpenAI synthesis fails | Retry with repair prompt, then build deterministic fallback atlas |
| Redis unavailable | Log error, return graceful 500 with retryable: true |
| Vapi format mismatch | Handle both `toolCallList[]` and `toolCalls[].function` formats |
| Vapi non-200 response | Always return 200; put error in `result` field to prevent duplicate runs |
