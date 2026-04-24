# API Contracts

## Vapi Tool Endpoint

```
POST /api/vapi/tools
```

Accepts both Vapi payload formats:

**Format 1 (primary):**
```json
{
  "message": {
    "type": "tool-calls",
    "toolCallList": [
      {
        "id": "tool_call_id",
        "name": "start_reality_check",
        "arguments": {
          "idea": "string",
          "target_user": "string",
          "current_alternative": "string",
          "why_now": "string",
          "biggest_risk": "string"
        }
      }
    ]
  }
}
```

**Format 2 (alternative):**
```json
{
  "message": {
    "type": "tool-calls",
    "toolCalls": [
      {
        "id": "tool_call_id",
        "function": {
          "name": "start_reality_check",
          "arguments": "{\"idea\": \"string\"}"
        }
      }
    ]
  }
}
```

**Response (always HTTP 200):**
```json
{
  "results": [
    {
      "toolCallId": "tool_call_id",
      "result": {
        "run_id": "run_abc123",
        "status": "running",
        "spoken_summary": "I'm checking competitors, substitutes, pricing, and user pain now."
      }
    }
  ]
}
```

## Create Run

```
POST /api/runs
```

Request:
```json
{
  "idea": "string",
  "target_user": "string",
  "current_alternative": "string",
  "why_now": "string",
  "constraints": ["string"],
  "unknowns": ["string"]
}
```

Response:
```json
{
  "run_id": "run_abc123",
  "status": "queued"
}
```

## Get Run

```
GET /api/runs/:runId
```

Response:
```json
{
  "run_id": "run_abc123",
  "status": "queued | running | partial | complete | failed | demo_fallback",
  "brief": {},
  "events": [],
  "evidence": [],
  "atlas": null
}
```

## Run Event Shape

```json
{
  "id": "evt_abc123",
  "run_id": "run_abc123",
  "type": "created | research_started | evidence_found | synthesis_started | complete | failed",
  "message": "string",
  "sponsor": "vapi | tinyfish | redis | llm | shipables | app",
  "created_at": "2026-04-24T11:00:00.000Z"
}
```

## Evidence Shape

```json
{
  "id": "ev_abc123",
  "run_id": "run_abc123",
  "url": "https://example.com",
  "title": "string",
  "snippet": "string",
  "claim": "string",
  "evidence_type": "competitor | substitute | pricing | pain | why_now",
  "confidence": 0.85,
  "source_tool": "tinyfish_search | tinyfish_fetch"
}
```

## Market Atlas Shape

```json
{
  "one_line_thesis": "string",
  "score": 67,
  "brutal_truth": "string",
  "promising_wedge": "string",
  "target_icp": "string",
  "competitors": [
    {"name": "string", "url": "string", "notes": "string"}
  ],
  "substitutes": ["string"],
  "risks": ["string"],
  "next_experiment": "string",
  "evidence_ids": ["ev_abc123"]
}
```

## Error Shape

```json
{
  "error": {
    "code": "NOT_FOUND | BAD_REQUEST | VALIDATION_ERROR | INTERNAL_ERROR",
    "message": "string",
    "retryable": true
  }
}
```

## Vapi Tool Definitions

### start_reality_check

```json
{
  "name": "start_reality_check",
  "description": "Start a live market reality check for a founder idea.",
  "parameters": {
    "type": "object",
    "properties": {
      "idea": {"type": "string", "description": "The startup idea to validate"},
      "target_user": {"type": "string", "description": "Who the product is for"},
      "current_alternative": {"type": "string", "description": "What users do today instead"},
      "why_now": {"type": "string", "description": "Why this is the right time to build this"},
      "biggest_risk": {"type": "string", "description": "The highest-risk assumption"}
    },
    "required": ["idea"]
  }
}
```

### get_reality_check_status

```json
{
  "name": "get_reality_check_status",
  "description": "Get progress and final verdict for a RealityCheck Live run.",
  "parameters": {
    "type": "object",
    "properties": {
      "run_id": {"type": "string", "description": "The run ID returned by start_reality_check"}
    },
    "required": ["run_id"]
  }
}
```
