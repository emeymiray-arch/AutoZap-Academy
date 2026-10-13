import { z } from "zod";

/** Typed lesson blocks — CMS-ready JSON stored on Lesson.content */

const ecosystemActorSchema = z.object({
  id: z.string(),
  label: z.string(),
  who: z.string(),
  gets: z.string(),
  interacts: z.string(),
});

export const lessonBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    eyebrow: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
  }),
  z.object({
    type: z.literal("callout"),
    tone: z.enum(["info", "warn", "ok"]).default("info"),
    title: z.string().optional(),
    body: z.string(),
  }),
  z.object({
    type: z.literal("paragraph"),
    body: z.string(),
  }),
  z.object({
    type: z.literal("bulletList"),
    title: z.string().optional(),
    items: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal("splitExistsVsPlan"),
    existsTitle: z.string().default("Уже работает / есть в фокусе"),
    planTitle: z.string().default("Стратегическое направление"),
    exists: z.array(z.string()),
    plan: z.array(z.string()),
  }),
  z.object({
    type: z.literal("openQuestion"),
    title: z.string().default("OPEN QUESTION"),
    body: z.string(),
    needsFromBusiness: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal("flowDiagram"),
    title: z.string().optional(),
    steps: z.array(z.string()).min(2),
  }),
  z.object({
    type: z.literal("ecosystemMap"),
    title: z.string().optional(),
    intro: z.string().optional(),
    actors: z.array(ecosystemActorSchema).min(1),
    flows: z
      .array(
        z.object({
          title: z.string(),
          steps: z.array(z.string()).min(2),
        }),
      )
      .optional(),
  }),
  z.object({
    type: z.literal("audiencePicker"),
    title: z.string(),
    intro: z.string().optional(),
    options: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.array(z.string()).min(1),
      }),
    ),
  }),
  z.object({
    type: z.literal("scenarioChoice"),
    id: z.string(),
    prompt: z.string(),
    options: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        /** Tiered AZ when this option is chosen (best / ok / weak). */
        qualityAz: z.number().int().nonnegative().optional(),
      }),
    ),
    /** Best answer — shown in explanation */
    correctOptionId: z.string(),
    /** Options that unlock the lesson gate; defaults to [correctOptionId] */
    passOptionIds: z.array(z.string()).optional(),
    explanation: z.string(),
  }),
  z.object({
    type: z.literal("problemSolution"),
    title: z.string().optional(),
    pairs: z.array(
      z.object({
        problem: z.string(),
        solution: z.string(),
      }),
    ),
  }),
  z.object({
    type: z.literal("knowledgeCheck"),
    id: z.string(),
    question: z.string(),
    options: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
      }),
    ),
    correctOptionId: z.string(),
    explanation: z.string(),
    required: z.boolean().default(true),
  }),
  z.object({
    type: z.literal("summary"),
    title: z.string().optional(),
    items: z.array(z.string()).min(1),
  }),
]);

export const lessonContentSchema = z.array(lessonBlockSchema);
export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export type LessonContent = z.infer<typeof lessonContentSchema>;

/** Assessment question types */

export const assessmentQuestionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mcq"),
    id: z.string(),
    prompt: z.string(),
    options: z.array(z.object({ id: z.string(), label: z.string() })),
    correctOptionId: z.string(),
    points: z.number().int().positive().default(1),
  }),
  z.object({
    type: z.literal("matching"),
    id: z.string(),
    prompt: z.string(),
    pairs: z.array(z.object({ left: z.string(), right: z.string() })),
    points: z.number().int().positive().default(1),
  }),
  z.object({
    type: z.literal("scenario"),
    id: z.string(),
    prompt: z.string(),
    options: z.array(z.object({ id: z.string(), label: z.string() })),
    correctOptionId: z.string(),
    explanation: z.string().optional(),
    points: z.number().int().positive().default(1),
  }),
  z.object({
    type: z.literal("findError"),
    id: z.string(),
    prompt: z.string(),
    statements: z.array(z.object({ id: z.string(), label: z.string() })),
    incorrectStatementId: z.string(),
    explanation: z.string().optional(),
    points: z.number().int().positive().default(1),
  }),
  z.object({
    type: z.literal("freeText"),
    id: z.string(),
    prompt: z.string(),
    hint: z.string().optional(),
    /** Not auto-scored — curator reviews via AssignmentSubmission */
    curatorReviewed: z.literal(true).default(true),
  }),
]);

export const assessmentContentSchema = z.array(assessmentQuestionSchema);
export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;
export type AssessmentContent = z.infer<typeof assessmentContentSchema>;

export function parseLessonContent(raw: unknown): LessonContent {
  return lessonContentSchema.parse(raw ?? []);
}

export function parseAssessmentContent(raw: unknown): AssessmentContent {
  return assessmentContentSchema.parse(raw ?? []);
}

export function requiredKnowledgeCheckIds(content: LessonContent): string[] {
  return content
    .filter((b): b is Extract<LessonBlock, { type: "knowledgeCheck" }> => b.type === "knowledgeCheck")
    .filter((b) => b.required)
    .map((b) => b.id);
}

export function requiredScenarioIds(content: LessonContent): string[] {
  return content.filter((b) => b.type === "scenarioChoice").map((b) => b.id);
}

export function scenarioPassIds(
  block: Extract<LessonBlock, { type: "scenarioChoice" }>,
): string[] {
  return block.passOptionIds?.length ? block.passOptionIds : [block.correctOptionId];
}

type CheckState = { optionId?: string; correct?: boolean; mistakes?: number };

/** True if all required checks/scenarios passed on the first try (no mistakes) */
export function isCleanLessonCheckpoint(
  content: LessonContent,
  checkpoint: Record<string, unknown>,
): boolean {
  for (const id of requiredKnowledgeCheckIds(content)) {
    const e = checkpoint[`kc:${id}`] as CheckState | undefined;
    if (!e?.correct || (e.mistakes ?? 0) > 0) return false;
  }
  for (const block of content) {
    if (block.type !== "scenarioChoice") continue;
    const e = checkpoint[`sc:${block.id}`] as CheckState | undefined;
    if (!e?.correct || (e.mistakes ?? 0) > 0) return false;
  }
  return true;
}

/** Sum of qualityAz from chosen scenario options (tiered cases) */
export function scenarioQualityAzEarned(
  content: LessonContent,
  checkpoint: Record<string, unknown>,
): number {
  let total = 0;
  for (const block of content) {
    if (block.type !== "scenarioChoice") continue;
    const e = checkpoint[`sc:${block.id}`] as CheckState | undefined;
    if (!e?.optionId) continue;
    const opt = block.options.find((o) => o.id === e.optionId);
    if (opt?.qualityAz != null) total += opt.qualityAz;
  }
  return total;
}
