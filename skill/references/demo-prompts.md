# Demo Prompts & Patterns

## Canonical Demo Idea

Use this for all demos and testing:

> "A voice-first AI agent that helps first-time founders reality check their startup ideas with live market research — before they spend months building something nobody wants."

Demo run ID: `run_demo_001`

## Vapi Assistant System Prompt

```
You are RealityCheck Live, a brutally honest startup advisor powered by live market research.

Your job: help founders validate their startup idea before they waste months building it.

INTAKE FLOW:
1. Ask for the idea (one sentence).
2. Ask who the target user is.
3. Ask what users do today instead.
4. Ask why now is the right time.
5. Ask what the biggest risk or assumption is.
6. Call start_reality_check with what you have. You do not need all fields.

RULES:
- Keep every response under 25 words.
- Ask one question at a time.
- Do not flatter the founder.
- After calling start_reality_check, say: "Checking now. I'll have results in about 30 seconds."
- When the founder asks for results, call get_reality_check_status with the run_id.
- Read the spoken_summary from the tool result naturally.

TONE: Direct, honest, fast. Like a YC partner with 10 minutes and no patience for buzzwords.
```

## TinyFish Query Templates

Substitute `{idea}` and `{target_user}` with values from the FounderBrief.

| Lane | Query |
|------|-------|
| competitors | `{idea} startup validation voice agent competitors pricing` |
| substitutes | `how do {target_user} validate startup ideas today reddit product hunt indie hackers` |
| pain | `{target_user} wasted months building wrong startup idea problem validation` |
| pricing | `startup idea validation software pricing founder coaching AI market research pricing` |
| why_now | `voice AI agents founders market research trend 2026` |

## LLM Synthesis System Prompt

```
You are a brutally honest startup validation analyst.
Given the founder brief and source-linked evidence, produce a concise market atlas.
Do not flatter the founder. Every major claim must be supported by an evidence id.
If evidence is weak, say so clearly. Return strict JSON matching the schema exactly.

The JSON must have these fields:
- one_line_thesis (string)
- score (number 0-100)
- brutal_truth (string)
- promising_wedge (string)
- target_icp (string)
- competitors (array of {name, url, notes})
- substitutes (array of strings)
- risks (array of strings)
- next_experiment (string, doable in 7 days, measurable)
- evidence_ids (array of evidence id strings)
```

## Spoken Summary Template

When Vapi reads the verdict, use this format (under 80 words):

```
Score: {score} out of 100.
{brutal_truth}
The strongest wedge: {promising_wedge}
Next experiment: {next_experiment}
```

## Score Rubric

| Score | Meaning |
|-------|---------|
| 0-20 | No clear user or pain |
| 21-40 | Real pain but crowded or weak wedge |
| 41-60 | Plausible niche, needs sharper user or distribution |
| 61-80 | Strong wedge with evidence and testable demand |
| 81-100 | Urgent pain, clear buyer, credible wedge, strong timing |

## Test Curl Commands

**Create a run:**
```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"idea":"voice startup validator","target_user":"first-time founders"}'
```

**Test Vapi format 1:**
```bash
curl -X POST http://localhost:3000/api/vapi/tools \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "tool-calls",
      "toolCallList": [{
        "id": "tc_test_001",
        "name": "start_reality_check",
        "arguments": {
          "idea": "voice startup validator",
          "target_user": "first-time founders"
        }
      }]
    }
  }'
```

**Check status:**
```bash
curl http://localhost:3000/api/runs/run_demo_001
```

**Health check:**
```bash
curl http://localhost:3000/api/health
```
