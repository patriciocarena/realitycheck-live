import { z } from "zod";

export const FounderBriefSchema = z.object({
  idea: z.string(),
  target_user: z.string().default("founders"),
  pain: z.string().default(""),
  current_alternative: z.string().default(""),
  why_now: z.string().default(""),
  constraints: z.array(z.string()).default([]),
  unknowns: z.array(z.string()).default([]),
});

export const EvidenceTypeSchema = z.enum([
  "competitor",
  "substitute",
  "pricing",
  "pain",
  "why_now",
]);

export const SourceToolSchema = z.enum([
  "tinyfish_search",
  "tinyfish_fetch",
]);

export const EvidenceSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  url: z.string(),
  title: z.string(),
  snippet: z.string(),
  claim: z.string(),
  evidence_type: EvidenceTypeSchema,
  confidence: z.number().min(0).max(1),
  source_tool: SourceToolSchema,
});

export const RunEventTypeSchema = z.enum([
  "created",
  "research_started",
  "evidence_found",
  "synthesis_started",
  "complete",
  "failed",
]);

export const SponsorSchema = z.enum([
  "vapi",
  "tinyfish",
  "redis",
  "llm",
  "shipables",
  "app",
]);

export const RunEventSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  type: RunEventTypeSchema,
  message: z.string(),
  sponsor: SponsorSchema,
  created_at: z.string(),
});

export const CompetitorSchema = z.object({
  name: z.string(),
  url: z.string(),
  notes: z.string(),
});

export const MarketAtlasSchema = z.object({
  one_line_thesis: z.string(),
  score: z.number().min(0).max(100),
  brutal_truth: z.string(),
  promising_wedge: z.string(),
  target_icp: z.string(),
  competitors: z.array(CompetitorSchema),
  substitutes: z.array(z.string()),
  risks: z.array(z.string()),
  next_experiment: z.string(),
  evidence_ids: z.array(z.string()),
});

export const RunStatusSchema = z.enum([
  "queued",
  "running",
  "partial",
  "complete",
  "failed",
  "demo_fallback",
]);

export const RunSchema = z.object({
  run_id: z.string(),
  status: RunStatusSchema,
  brief: FounderBriefSchema,
  events: z.array(RunEventSchema),
  evidence: z.array(EvidenceSchema),
  atlas: MarketAtlasSchema.nullable(),
});

export type FounderBrief = z.infer<typeof FounderBriefSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;
export type RunEvent = z.infer<typeof RunEventSchema>;
export type MarketAtlas = z.infer<typeof MarketAtlasSchema>;
export type Run = z.infer<typeof RunSchema>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export type Sponsor = z.infer<typeof SponsorSchema>;
