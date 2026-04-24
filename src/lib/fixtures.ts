import type { Run, Evidence, MarketAtlas } from "./models";

export const DEMO_SEEDED_RUN_ID = "run_demo_001";

export const DEMO_EVIDENCE_LIST: Evidence[] = [
  {
    id: "ev_demo_001",
    run_id: DEMO_SEEDED_RUN_ID,
    url: "https://www.producthunt.com/products/ideacheck-ai",
    title: "IdeaCheck AI — Validate your startup idea in minutes",
    snippet:
      "IdeaCheck AI helps founders validate startup ideas with AI-powered market analysis. Pricing starts at $29/month for solo founders, $99/month for teams.",
    claim: "Direct competitor charging $29-99/month for AI startup validation",
    evidence_type: "competitor",
    confidence: 0.82,
    source_tool: "tinyfish_search",
  },
  {
    id: "ev_demo_002",
    run_id: DEMO_SEEDED_RUN_ID,
    url: "https://www.validately.com/pricing",
    title: "Validately — User Research & Startup Validation Platform",
    snippet:
      "Validately offers startup idea validation through user research panels. Plans from $49 to $299/month. Used by 12,000+ early-stage founders.",
    claim: "Established competitor with 12k+ users, $49-299/month pricing",
    evidence_type: "competitor",
    confidence: 0.79,
    source_tool: "tinyfish_fetch",
  },
  {
    id: "ev_demo_003",
    run_id: DEMO_SEEDED_RUN_ID,
    url: "https://www.reddit.com/r/startups/comments/validate_ideas_before_building",
    title: "How do you validate startup ideas before spending months building? : r/startups",
    snippet:
      "I spent 8 months building a product nobody wanted. Now I just post in Reddit communities and do 5 cold DMs before writing a single line of code. The most common substitute is manual outreach + spreadsheets.",
    claim: "Primary substitute is manual Reddit/community outreach + spreadsheets",
    evidence_type: "substitute",
    confidence: 0.88,
    source_tool: "tinyfish_search",
  },
  {
    id: "ev_demo_004",
    run_id: DEMO_SEEDED_RUN_ID,
    url: "https://indiehackers.com/post/how-i-validate-ideas-fast",
    title: "How I validate startup ideas in 48 hours | Indie Hackers",
    snippet:
      "My validation stack: Landing page on Carrd ($19/yr), cold outreach via LinkedIn, and a Typeform survey. Total cost under $50. No AI tools — just old-school hustle.",
    claim: "No-code landing page + cold outreach is the dominant substitute at <$50",
    evidence_type: "substitute",
    confidence: 0.85,
    source_tool: "tinyfish_search",
  },
  {
    id: "ev_demo_005",
    run_id: DEMO_SEEDED_RUN_ID,
    url: "https://twitter.com/paulg/status/startup_mistakes_2024",
    title: "Paul Graham on startup mistakes: building before validating",
    snippet:
      "The #1 mistake I see in YC applications: founders who spent 6-12 months building something nobody wanted because they never talked to users first. Voice-first tools could help founders catch this faster.",
    claim: "6-12 month wasted builds from poor validation is a well-documented, widespread pain",
    evidence_type: "pain",
    confidence: 0.91,
    source_tool: "tinyfish_search",
  },
  {
    id: "ev_demo_006",
    run_id: DEMO_SEEDED_RUN_ID,
    url: "https://www.cbinsights.com/research/startup-failure-reasons",
    title: "The Top 12 Reasons Startups Fail | CB Insights Research",
    snippet:
      "42% of startups fail because there's no market need. The second most common reason (29%) is running out of cash — often caused by building the wrong thing too long.",
    claim: "42% of startup failures trace to lack of market validation — high urgency pain",
    evidence_type: "pain",
    confidence: 0.94,
    source_tool: "tinyfish_fetch",
  },
  {
    id: "ev_demo_007",
    run_id: DEMO_SEEDED_RUN_ID,
    url: "https://www.g2.com/categories/market-research/pricing",
    title: "Market Research Software Pricing 2026 | G2",
    snippet:
      "Market research tools average $50-300/month for SMB tier. Enterprise market research platforms (Qualtrics, SurveyMonkey Audience) run $1,500-10,000/month. AI-native tools are clustering around $30-100/month.",
    claim: "AI-native market research tools cluster at $30-100/month; clear pricing anchor",
    evidence_type: "pricing",
    confidence: 0.87,
    source_tool: "tinyfish_fetch",
  },
  {
    id: "ev_demo_008",
    run_id: DEMO_SEEDED_RUN_ID,
    url: "https://techcrunch.com/2026/03/voice-ai-agents-enterprise",
    title: "Voice AI agents are reshaping how founders interact with research tools | TechCrunch",
    snippet:
      "2026 is the year voice-first AI agents hit mainstream adoption in B2B workflows. Vapi, ElevenLabs, and Bland AI are enabling a new class of voice-native applications. Founders are increasingly experimenting with voice-first tools for GTM research.",
    claim: "Voice-first AI agent adoption is surging in 2026 — strong timing signal",
    evidence_type: "why_now",
    confidence: 0.83,
    source_tool: "tinyfish_search",
  },
];

export const DEMO_ATLAS: MarketAtlas = {
  one_line_thesis:
    "First-time founders need a voice-first reality check agent that delivers source-cited market research in under 60 seconds — before they waste months building the wrong thing.",
  score: 67,
  brutal_truth:
    "The validation space is crowded with text-based tools. Voice is genuinely novel but adds friction for solo founders who prefer async. The wedge must be speed + citations, not just modality. Without distribution, this is a feature, not a product.",
  promising_wedge:
    "Target YC/accelerator cohorts where founders are required to validate before building. Position as the fastest structured feedback loop before Demo Day prep.",
  target_icp:
    "First-time technical founders in pre-seed accelerator programs (YC, Techstars, On Deck) who have an idea but no market research background.",
  competitors: [
    {
      name: "IdeaCheck AI",
      url: "https://www.producthunt.com/products/ideacheck-ai",
      notes: "$29-99/month, text-based, no voice interface, no live web research",
    },
    {
      name: "Validately",
      url: "https://www.validately.com/pricing",
      notes: "$49-299/month, user research panels, slow turnaround, not AI-native",
    },
  ],
  substitutes: [
    "Manual Reddit/community outreach + spreadsheets (free, slow)",
    "Cold LinkedIn DMs + Typeform surveys (<$50, no synthesis)",
    "Hiring a market research freelancer ($500-2000/project, 1-2 weeks)",
    "YC's internal startup school resources (free but generic)",
  ],
  risks: [
    "Voice modality may not fit founder workflows — async is often preferred",
    "TinyFish evidence quality varies by industry; thin evidence on niche markets",
    "High competition: well-funded incumbents (Qualtrics, SurveyMonkey) moving toward AI",
    "Without a distribution channel (accelerator partnership), CAC will be high",
  ],
  next_experiment:
    "Run a 5-founder sprint inside one accelerator cohort this week. Measure: do founders share the output with teammates, or discard it? If 3/5 share, distribution via cohort word-of-mouth is real.",
  evidence_ids: [
    "ev_demo_001",
    "ev_demo_002",
    "ev_demo_003",
    "ev_demo_004",
    "ev_demo_005",
    "ev_demo_006",
    "ev_demo_007",
    "ev_demo_008",
  ],
};

export const DEMO_RUN: Run = {
  run_id: DEMO_SEEDED_RUN_ID,
  status: "demo_fallback",
  brief: {
    idea: "A voice-first AI agent that helps first-time founders reality check their startup ideas with live market research",
    target_user: "first-time founders in pre-seed accelerator programs",
    pain: "Founders spend 6-12 months building products nobody wants because they skip market validation",
    current_alternative: "Manual Reddit outreach, cold DMs, and spreadsheets",
    why_now: "Voice AI agents hit mainstream B2B adoption in 2026; Vapi makes voice-first tools buildable in a weekend",
    constraints: ["bootstrapped", "solo founder", "no design background"],
    unknowns: ["willingness to pay before seeing results", "voice vs async preference"],
  },
  events: [
    {
      id: "evt_demo_001",
      run_id: DEMO_SEEDED_RUN_ID,
      type: "created",
      message: "Run created from Vapi voice intake",
      sponsor: "vapi",
      created_at: "2026-04-24T11:00:00.000Z",
    },
    {
      id: "evt_demo_002",
      run_id: DEMO_SEEDED_RUN_ID,
      type: "research_started",
      message: "Launching 5 research lanes: competitors, substitutes, pain, pricing, why_now",
      sponsor: "tinyfish",
      created_at: "2026-04-24T11:00:01.000Z",
    },
    {
      id: "evt_demo_003",
      run_id: DEMO_SEEDED_RUN_ID,
      type: "evidence_found",
      message: "Found 2 direct competitors via TinyFish Search",
      sponsor: "tinyfish",
      created_at: "2026-04-24T11:00:08.000Z",
    },
    {
      id: "evt_demo_004",
      run_id: DEMO_SEEDED_RUN_ID,
      type: "evidence_found",
      message: "Found substitute workflows on Reddit and Indie Hackers",
      sponsor: "tinyfish",
      created_at: "2026-04-24T11:00:15.000Z",
    },
    {
      id: "evt_demo_005",
      run_id: DEMO_SEEDED_RUN_ID,
      type: "evidence_found",
      message: "CB Insights confirms 42% failure rate from poor validation — high-confidence pain signal",
      sponsor: "tinyfish",
      created_at: "2026-04-24T11:00:22.000Z",
    },
    {
      id: "evt_demo_006",
      run_id: DEMO_SEEDED_RUN_ID,
      type: "evidence_found",
      message: "Pricing data: AI-native tools cluster at $30-100/month",
      sponsor: "redis",
      created_at: "2026-04-24T11:00:28.000Z",
    },
    {
      id: "evt_demo_007",
      run_id: DEMO_SEEDED_RUN_ID,
      type: "synthesis_started",
      message: "8 evidence items collected. Starting LLM market atlas synthesis.",
      sponsor: "llm",
      created_at: "2026-04-24T11:00:35.000Z",
    },
    {
      id: "evt_demo_008",
      run_id: DEMO_SEEDED_RUN_ID,
      type: "complete",
      message: "Market atlas complete. Score: 67/100.",
      sponsor: "llm",
      created_at: "2026-04-24T11:00:48.000Z",
    },
  ],
  evidence: DEMO_EVIDENCE_LIST,
  atlas: DEMO_ATLAS,
};
