import type {
  AzActionType,
  AzLedgerKind,
  AzLevelRule,
  AzQualityRange,
  AzRewardRule,
  AzRewardRuleVersion,
  AzScopeType,
  FinalStatus,
  Prisma,
  PrismaClient,
  TieBreakCriterion,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../db";

export type DbClient = PrismaClient | Prisma.TransactionClient;

export type QualityRangeInput = {
  label: string;
  minAz: number;
  maxAz: number;
  criteria?: string | null;
  sortOrder?: number;
};

export type RewardRuleDraft = {
  actionType: AzActionType;
  scopeType: AzScopeType;
  courseId?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  name: string;
  description?: string | null;
  maxAz: number;
  allowsPartial: boolean;
  allowsRepeat: boolean;
  qualityDependent: boolean;
  conditionsJson?: string;
  autoReductionJson?: string | null;
  qualityRanges?: QualityRangeInput[];
  active?: boolean;
  createdById?: string | null;
  note?: string | null;
};

export type ApplyRewardInput = {
  userId: string;
  actionType: AzActionType;
  sourceType: string;
  sourceId: string;
  /** Requested award; clamped by rule max / partial settings */
  amount: number;
  qualityLabel?: string | null;
  reason: string;
  idempotencyKey: string;
  courseId?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  kind?: AzLedgerKind;
  createdById?: string | null;
  /** Force a specific rule version (recalc); default = current active */
  ruleVersionId?: string | null;
};

export type RecalculateRewardInput = {
  userId: string;
  sourceType: string;
  sourceId: string;
  newAmount: number;
  qualityLabel?: string | null;
  reason: string;
  idempotencyKey: string;
  createdById?: string | null;
  kind?: Extract<AzLedgerKind, "REGRADE" | "RULE_RECALC">;
};

export type StudentAzSummary = {
  balance: number;
  maxAvailableAz: number;
  level: {
    id: string;
    slug: string;
    name: string;
    minAz: number;
    maxAz: number | null;
  } | null;
  nextLevel: {
    id: string;
    slug: string;
    name: string;
    minAz: number;
    azNeeded: number;
  } | null;
  progressToNextLevelPercent: number;
};

export type AzHistoryItem = {
  id: string;
  kind: AzLedgerKind;
  actionType: AzActionType;
  sourceType: string;
  sourceId: string;
  delta: number;
  balanceAfter: number;
  maxAz: number | null;
  awardedAz: number | null;
  previousAwardedAz: number | null;
  qualityLabel: string | null;
  reason: string;
  ruleId: string | null;
  ruleVersionId: string | null;
  createdAt: Date;
};

type RuleWithVersion = AzRewardRule & {
  versions: (AzRewardRuleVersion & { ranges: AzQualityRange[] })[];
};

function assertNonNegativeAz(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}

function scopeScore(scopeType: AzScopeType): number {
  switch (scopeType) {
    case "LESSON":
      return 4;
    case "MODULE":
      return 3;
    case "COURSE":
      return 2;
    case "GLOBAL":
      return 1;
    default:
      return 0;
  }
}

export class AZService {
  constructor(private readonly db: DbClient) {}

  // ── Rules ────────────────────────────────────────────────

  async createRewardRule(draft: RewardRuleDraft): Promise<AzRewardRule> {
    assertNonNegativeAz(draft.maxAz, "maxAz");
    this.validateQualityRanges(draft.maxAz, draft.qualityDependent, draft.qualityRanges);

    return this.db.azRewardRule.create({
      data: {
        actionType: draft.actionType,
        scopeType: draft.scopeType,
        courseId: draft.courseId ?? null,
        moduleId: draft.moduleId ?? null,
        lessonId: draft.lessonId ?? null,
        name: draft.name,
        description: draft.description ?? null,
        active: draft.active ?? true,
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            maxAz: draft.maxAz,
            allowsPartial: draft.allowsPartial,
            allowsRepeat: draft.allowsRepeat,
            qualityDependent: draft.qualityDependent,
            conditionsJson: draft.conditionsJson ?? "{}",
            autoReductionJson: draft.autoReductionJson ?? null,
            active: true,
            createdById: draft.createdById ?? null,
            note: draft.note ?? "initial",
            ranges: {
              create: (draft.qualityRanges ?? []).map((r, i) => ({
                label: r.label,
                minAz: r.minAz,
                maxAz: r.maxAz,
                criteria: r.criteria ?? null,
                sortOrder: r.sortOrder ?? i,
              })),
            },
          },
        },
      },
    });
  }

  /**
   * Publishes a new version of a rule.
   * FUTURE_ONLY: new actions use new version.
   * RECALCULATE_EXISTING: also recalculates prior awards for this rule.
   */
  async publishRewardRuleVersion(params: {
    ruleId: string;
    maxAz: number;
    allowsPartial: boolean;
    allowsRepeat: boolean;
    qualityDependent: boolean;
    conditionsJson?: string;
    autoReductionJson?: string | null;
    qualityRanges?: QualityRangeInput[];
    applyMode: "FUTURE_ONLY" | "RECALCULATE_EXISTING";
    createdById?: string | null;
    note?: string | null;
  }) {
    assertNonNegativeAz(params.maxAz, "maxAz");
    this.validateQualityRanges(params.maxAz, params.qualityDependent, params.qualityRanges);

    const rule = await this.db.azRewardRule.findUniqueOrThrow({
      where: { id: params.ruleId },
    });
    const nextVersion = rule.currentVersion + 1;

    const version = await this.db.azRewardRuleVersion.create({
      data: {
        ruleId: params.ruleId,
        version: nextVersion,
        maxAz: params.maxAz,
        allowsPartial: params.allowsPartial,
        allowsRepeat: params.allowsRepeat,
        qualityDependent: params.qualityDependent,
        conditionsJson: params.conditionsJson ?? "{}",
        autoReductionJson: params.autoReductionJson ?? null,
        applyModeOnPublish: params.applyMode,
        active: true,
        createdById: params.createdById ?? null,
        note: params.note ?? null,
        ranges: {
          create: (params.qualityRanges ?? []).map((r, i) => ({
            label: r.label,
            minAz: r.minAz,
            maxAz: r.maxAz,
            criteria: r.criteria ?? null,
            sortOrder: r.sortOrder ?? i,
          })),
        },
      },
      include: { ranges: true },
    });

    await this.db.azRewardRule.update({
      where: { id: params.ruleId },
      data: { currentVersion: nextVersion },
    });

    let recalcSummary: { processed: number; adjusted: number } | null = null;
    if (params.applyMode === "RECALCULATE_EXISTING") {
      recalcSummary = await this.recalculateRewardsForRule({
        ruleId: params.ruleId,
        toVersionId: version.id,
        createdById: params.createdById ?? null,
      });
    }

    return { version, recalcSummary };
  }

  async listRewardRules() {
    return this.db.azRewardRule.findMany({
      include: {
        versions: {
          where: { active: true },
          orderBy: { version: "desc" },
          take: 1,
          include: { ranges: { orderBy: { sortOrder: "asc" } } },
        },
        course: true,
        module: true,
        lesson: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getActiveRuleForAction(params: {
    actionType: AzActionType;
    courseId?: string | null;
    moduleId?: string | null;
    lessonId?: string | null;
  }): Promise<RuleWithVersion | null> {
    const candidates = await this.db.azRewardRule.findMany({
      where: { actionType: params.actionType, active: true },
      include: {
        versions: {
          where: { active: true },
          orderBy: { version: "desc" },
          take: 1,
          include: { ranges: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    const matching = candidates
      .filter((rule) => this.ruleMatchesScope(rule, params))
      .sort((a, b) => scopeScore(b.scopeType) - scopeScore(a.scopeType));

    const best = matching[0];
    if (!best || best.versions.length === 0) return null;
    return best as RuleWithVersion;
  }

  /** Resolves how many AZ should be awarded given rule + requested amount. */
  async calculateReward(params: {
    actionType: AzActionType;
    amount: number;
    courseId?: string | null;
    moduleId?: string | null;
    lessonId?: string | null;
    qualityLabel?: string | null;
  }) {
    const rule = await this.getActiveRuleForAction(params);
    if (!rule) {
      throw new Error(`No active AZ reward rule for action ${params.actionType}`);
    }
    const version = rule.versions[0];
    const awarded = this.clampAwardAmount({
      requested: params.amount,
      version,
      qualityLabel: params.qualityLabel,
    });

    return {
      rule,
      version,
      maxAz: version.maxAz,
      awardedAz: awarded.awardedAz,
      qualityLabel: awarded.qualityLabel,
      qualityRanges: version.ranges,
    };
  }

  async applyReward(input: ApplyRewardInput) {
    const existing = await this.db.azLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return { entry: existing, idempotentReplay: true as const };

    const rule = input.ruleVersionId
      ? await this.loadRuleByVersionId(input.ruleVersionId)
      : await this.getActiveRuleForAction({
          actionType: input.actionType,
          courseId: input.courseId,
          moduleId: input.moduleId,
          lessonId: input.lessonId,
        });

    if (!rule) {
      throw new Error(`No active AZ reward rule for action ${input.actionType}`);
    }
    const version = rule.versions[0];

    const priorAwards = await this.db.azLedgerEntry.findMany({
      where: {
        userId: input.userId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        kind: { in: ["INITIAL", "REPEAT", "REGRADE", "RULE_RECALC"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const hasInitial = priorAwards.some((e) => e.kind === "INITIAL" || e.kind === "REPEAT");
    if (hasInitial && !version.allowsRepeat && (input.kind === undefined || input.kind === "INITIAL" || input.kind === "REPEAT")) {
      throw new Error("Repeat AZ awards are disabled for this rule");
    }

    const kind: AzLedgerKind =
      input.kind ?? (hasInitial && version.allowsRepeat ? "REPEAT" : "INITIAL");

    const clamped = this.clampAwardAmount({
      requested: input.amount,
      version,
      qualityLabel: input.qualityLabel,
    });

    const balance = await this.ensureBalance(input.userId);
    const delta = clamped.awardedAz;
    const balanceAfter = balance.balance + delta;

    const entry = await this.db.azLedgerEntry.create({
      data: {
        userId: input.userId,
        delta,
        balanceAfter,
        kind,
        actionType: input.actionType,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        ruleId: rule.id,
        ruleVersionId: version.id,
        maxAz: version.maxAz,
        awardedAz: clamped.awardedAz,
        previousAwardedAz: null,
        qualityLabel: clamped.qualityLabel,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
        createdById: input.createdById ?? null,
      },
    });

    await this.recalculateLevel(input.userId, balanceAfter);
    return { entry, idempotentReplay: false as const };
  }

  /** Regrade / rule recalc: adjusts balance by delta between old effective award and new. */
  async recalculateReward(input: RecalculateRewardInput) {
    const existing = await this.db.azLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return { entry: existing, idempotentReplay: true as const };

    const latest = await this.getLatestAwardForSource(
      input.userId,
      input.sourceType,
      input.sourceId,
    );
    if (!latest || latest.awardedAz == null) {
      throw new Error("No prior AZ award found to recalculate");
    }

    let ruleVersion = latest.ruleVersionId
      ? (
          await this.db.azRewardRuleVersion.findUnique({
            where: { id: latest.ruleVersionId },
            include: { ranges: true, rule: true },
          })
        )
      : null;

    // Prefer current active version for RULE_RECALC
    if (input.kind === "RULE_RECALC" && latest.ruleId) {
      const current = await this.db.azRewardRule.findUnique({
        where: { id: latest.ruleId },
        include: {
          versions: {
            where: { active: true },
            orderBy: { version: "desc" },
            take: 1,
            include: { ranges: true },
          },
        },
      });
      if (current?.versions[0]) {
        ruleVersion = { ...current.versions[0], rule: current };
      }
    }

    if (!ruleVersion) {
      throw new Error("Reward rule version missing for recalculation");
    }

    const clamped = this.clampAwardAmount({
      requested: input.newAmount,
      version: ruleVersion,
      qualityLabel: input.qualityLabel,
    });

    const previousAwarded = latest.awardedAz;
    const delta = clamped.awardedAz - previousAwarded;
    const balance = await this.ensureBalance(input.userId);
    const balanceAfter = balance.balance + delta;

    const entry = await this.db.azLedgerEntry.create({
      data: {
        userId: input.userId,
        delta,
        balanceAfter,
        kind: input.kind ?? "REGRADE",
        actionType: latest.actionType,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        ruleId: ruleVersion.ruleId,
        ruleVersionId: ruleVersion.id,
        maxAz: ruleVersion.maxAz,
        awardedAz: clamped.awardedAz,
        previousAwardedAz: previousAwarded,
        qualityLabel: clamped.qualityLabel,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
        createdById: input.createdById ?? null,
      },
    });

    await this.recalculateLevel(input.userId, balanceAfter);
    return { entry, idempotentReplay: false as const };
  }

  async applyAutoReduction(params: {
    userId: string;
    actionType: AzActionType;
    sourceType: string;
    sourceId: string;
    amount: number;
    reason: string;
    idempotencyKey: string;
    ruleId: string;
    ruleVersionId: string;
    createdById?: string | null;
  }) {
    const existing = await this.db.azLedgerEntry.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
    });
    if (existing) return { entry: existing, idempotentReplay: true as const };

    assertNonNegativeAz(params.amount, "reduction amount");
    const version = await this.db.azRewardRuleVersion.findUniqueOrThrow({
      where: { id: params.ruleVersionId },
    });
    if (!version.autoReductionJson) {
      throw new Error("Auto-reduction is not configured on this rule version");
    }

    const balance = await this.ensureBalance(params.userId);
    const delta = -Math.min(params.amount, balance.balance);
    const balanceAfter = balance.balance + delta;

    const entry = await this.db.azLedgerEntry.create({
      data: {
        userId: params.userId,
        delta,
        balanceAfter,
        kind: "AUTO_REDUCTION",
        actionType: params.actionType,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        ruleId: params.ruleId,
        ruleVersionId: params.ruleVersionId,
        maxAz: version.maxAz,
        awardedAz: Math.abs(delta),
        previousAwardedAz: null,
        qualityLabel: null,
        reason: params.reason,
        idempotencyKey: params.idempotencyKey,
        createdById: params.createdById ?? null,
      },
    });

    await this.recalculateLevel(params.userId, balanceAfter);
    return { entry, idempotentReplay: false as const };
  }

  async calculateModuleMaximum(moduleId: string): Promise<{
    calculated: number;
    effective: number;
    override: number | null;
    useOverride: boolean;
  }> {
    const module = await this.db.module.findUniqueOrThrow({
      where: { id: moduleId },
      include: { lessons: true, course: true },
    });

    const rules = await this.db.azRewardRule.findMany({
      where: {
        active: true,
        OR: [
          { scopeType: "MODULE", moduleId },
          { scopeType: "LESSON", lessonId: { in: module.lessons.map((l) => l.id) } },
          { scopeType: "COURSE", courseId: module.courseId },
        ],
      },
      include: {
        versions: {
          where: { active: true },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    // Sum most-specific max AZ per unique action+source scope to avoid double-counting globals.
    let calculated = 0;
    const seen = new Set<string>();
    for (const lesson of module.lessons) {
      for (const rule of rules) {
        if (rule.scopeType === "LESSON" && rule.lessonId === lesson.id) {
          const key = `${rule.actionType}:lesson:${lesson.id}`;
          if (!seen.has(key) && rule.versions[0]) {
            seen.add(key);
            calculated += rule.versions[0].maxAz;
          }
        }
      }
    }
    for (const rule of rules) {
      if (rule.scopeType === "MODULE" && rule.moduleId === moduleId) {
        const key = `${rule.actionType}:module:${moduleId}`;
        if (!seen.has(key) && rule.versions[0]) {
          seen.add(key);
          calculated += rule.versions[0].maxAz;
        }
      }
    }

    const useOverride = module.useMaxAzOverride && module.maxAzOverride != null;
    const effective = useOverride ? (module.maxAzOverride as number) : calculated;

    return {
      calculated,
      effective,
      override: module.maxAzOverride,
      useOverride,
    };
  }

  async setModuleMaximumOverride(moduleId: string, override: number | null, useOverride: boolean) {
    if (override != null) assertNonNegativeAz(override, "module max AZ override");
    return this.db.module.update({
      where: { id: moduleId },
      data: { maxAzOverride: override, useMaxAzOverride: useOverride },
    });
  }

  async calculateLevel(balance: number): Promise<AzLevelRule | null> {
    const levels = await this.db.azLevelRule.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    if (levels.length === 0) return null;

    let matched: AzLevelRule | null = null;
    for (const level of levels) {
      const withinMin = balance >= level.minAz;
      const withinMax = level.maxAz == null ? true : balance < level.maxAz;
      if (withinMin && withinMax) matched = level;
    }
    // If below all mins, use lowest level if balance >= 0 and lowest starts at 0
    if (!matched) {
      const lowest = levels[0];
      if (balance < lowest.minAz) return lowest.minAz === 0 ? lowest : null;
    }
    return matched;
  }

  async recalculateLevel(userId: string, balanceOverride?: number) {
    const balanceRow = await this.ensureBalance(userId);
    const balance = balanceOverride ?? balanceRow.balance;
    const level = await this.calculateLevel(balance);
    const maxAvailableAz = await this.calculateMaxAvailableAz();

    return this.db.userAzBalance.update({
      where: { userId },
      data: {
        balance,
        levelRuleId: level?.id ?? null,
        maxAvailableAz,
      },
      include: { level: true },
    });
  }

  async getStudentAZSummary(userId: string): Promise<StudentAzSummary> {
    const balanceRow = await this.recalculateLevel(userId);
    const levels = await this.db.azLevelRule.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });

    const current = balanceRow.level;
    let nextLevel: StudentAzSummary["nextLevel"] = null;
    let progress = 100;

    if (current) {
      const idx = levels.findIndex((l) => l.id === current.id);
      const next = idx >= 0 ? levels[idx + 1] : null;
      if (next) {
        const span = Math.max(1, next.minAz - current.minAz);
        const gained = Math.max(0, balanceRow.balance - current.minAz);
        progress = Math.min(100, Math.round((gained / span) * 100));
        nextLevel = {
          id: next.id,
          slug: next.slug,
          name: next.name,
          minAz: next.minAz,
          azNeeded: Math.max(0, next.minAz - balanceRow.balance),
        };
      }
    } else if (levels[0]) {
      nextLevel = {
        id: levels[0].id,
        slug: levels[0].slug,
        name: levels[0].name,
        minAz: levels[0].minAz,
        azNeeded: Math.max(0, levels[0].minAz - balanceRow.balance),
      };
      progress = 0;
    }

    return {
      balance: balanceRow.balance,
      maxAvailableAz: balanceRow.maxAvailableAz,
      level: current
        ? {
            id: current.id,
            slug: current.slug,
            name: current.name,
            minAz: current.minAz,
            maxAz: current.maxAz,
          }
        : null,
      nextLevel,
      progressToNextLevelPercent: progress,
    };
  }

  async getAZHistory(userId: string): Promise<AzHistoryItem[]> {
    const rows = await this.db.azLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      actionType: r.actionType,
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      delta: r.delta,
      balanceAfter: r.balanceAfter,
      maxAz: r.maxAz,
      awardedAz: r.awardedAz,
      previousAwardedAz: r.previousAwardedAz,
      qualityLabel: r.qualityLabel,
      reason: r.reason,
      ruleId: r.ruleId,
      ruleVersionId: r.ruleVersionId,
      createdAt: r.createdAt,
    }));
  }

  async calculateFinalRanking(params?: { graduatedUserIds?: string[] }) {
    const tieBreaks = await this.db.rankingTieBreakRule.findMany({
      where: { active: true },
      orderBy: { priority: "asc" },
    });

    const balances = await this.db.userAzBalance.findMany({
      include: { user: true, level: true },
    });

    let candidates = balances.filter((b) => b.user.role === "STUDENT");
    if (params?.graduatedUserIds) {
      const set = new Set(params.graduatedUserIds);
      candidates = candidates.filter((b) => set.has(b.userId));
    }

    const enriched = await Promise.all(
      candidates.map(async (b) => ({
        userId: b.userId,
        name: b.user.name,
        totalAz: b.balance,
        modulesCompleted: await this.countCompletedModules(b.userId),
        assignmentsAvgAz: await this.avgAwardedForAction(b.userId, "ASSIGNMENT_REVIEWED"),
        quizAvgAz: await this.avgAwardedForAction(b.userId, "QUIZ_COMPLETED"),
        simulationAvgAz: await this.avgAwardedForAction(b.userId, "SIMULATION_COMPLETED"),
        certificationDate: await this.firstAwardDate(b.userId, "CERTIFICATION"),
      })),
    );

    enriched.sort((a, b) => {
      for (const rule of tieBreaks) {
        const cmp = this.compareTieBreak(a, b, rule.criterion, rule.descending);
        if (cmp !== 0) return cmp;
      }
      // Default fallback if no rules: total AZ desc, then userId
      if (b.totalAz !== a.totalAz) return b.totalAz - a.totalAz;
      return a.userId.localeCompare(b.userId);
    });

    return enriched.map((row, index) => ({
      rank: index + 1,
      ...row,
    }));
  }

  async determineFinalStatus(params?: { graduatedUserIds?: string[] }) {
    const ranking = await this.calculateFinalRanking(params);
    const results: { userId: string; status: FinalStatus; rank: number }[] = [];

    for (const row of ranking) {
      let status: FinalStatus = "MANAGER";
      if (row.rank === 1) status = "TOP_1";
      else if (row.rank === 2) status = "TOP_2";
      else if (row.rank === 3) status = "TOP_3";

      await this.db.finalStatusAssignment.upsert({
        where: { userId: row.userId },
        create: { userId: row.userId, status, rank: row.rank },
        update: { status, rank: row.rank },
      });

      results.push({ userId: row.userId, status, rank: row.rank });
    }

    return results;
  }

  async createLevelRule(data: {
    slug: string;
    name: string;
    minAz: number;
    maxAz?: number | null;
    sortOrder: number;
    active?: boolean;
  }) {
    assertNonNegativeAz(data.minAz, "minAz");
    if (data.maxAz != null) assertNonNegativeAz(data.maxAz, "maxAz");
    return this.db.azLevelRule.create({
      data: {
        slug: data.slug,
        name: data.name,
        minAz: data.minAz,
        maxAz: data.maxAz ?? null,
        sortOrder: data.sortOrder,
        active: data.active ?? true,
      },
    });
  }

  async listLevelRules() {
    return this.db.azLevelRule.findMany({ orderBy: { sortOrder: "asc" } });
  }

  // ── Internals ────────────────────────────────────────────

  private validateQualityRanges(
    maxAz: number,
    qualityDependent: boolean,
    ranges?: QualityRangeInput[],
  ) {
    if (!qualityDependent) return;
    if (!ranges || ranges.length === 0) {
      throw new Error("Quality-dependent rules require at least one quality range");
    }
    for (const r of ranges) {
      assertNonNegativeAz(r.minAz, "quality range minAz");
      assertNonNegativeAz(r.maxAz, "quality range maxAz");
      if (r.minAz > r.maxAz) throw new Error("quality range minAz cannot exceed maxAz");
      if (r.maxAz > maxAz) throw new Error("quality range cannot exceed rule maxAz");
    }
  }

  private ruleMatchesScope(
    rule: Pick<AzRewardRule, "scopeType" | "courseId" | "moduleId" | "lessonId">,
    ctx: { courseId?: string | null; moduleId?: string | null; lessonId?: string | null },
  ) {
    switch (rule.scopeType) {
      case "GLOBAL":
        return true;
      case "COURSE":
        return !!ctx.courseId && rule.courseId === ctx.courseId;
      case "MODULE":
        return !!ctx.moduleId && rule.moduleId === ctx.moduleId;
      case "LESSON":
        return !!ctx.lessonId && rule.lessonId === ctx.lessonId;
      default:
        return false;
    }
  }

  private clampAwardAmount(params: {
    requested: number;
    version: Pick<
      AzRewardRuleVersion,
      "maxAz" | "allowsPartial" | "qualityDependent"
    > & { ranges?: AzQualityRange[] };
    qualityLabel?: string | null;
  }) {
    const { requested, version, qualityLabel } = params;
    assertNonNegativeAz(requested, "requested AZ");

    let capped = Math.min(requested, version.maxAz);

    if (version.qualityDependent && qualityLabel && version.ranges) {
      const range = version.ranges.find((r) => r.label === qualityLabel);
      if (!range) {
        throw new Error(`Unknown quality label: ${qualityLabel}`);
      }
      if (capped < range.minAz || capped > range.maxAz) {
        // If amount outside label band, clamp into the declared band
        capped = Math.min(Math.max(capped, range.minAz), range.maxAz);
      }
    }

    if (!version.allowsPartial && capped !== 0 && capped !== version.maxAz) {
      // Non-partial: only full award or zero
      capped = capped > 0 ? version.maxAz : 0;
    }

    return {
      awardedAz: capped,
      qualityLabel: qualityLabel ?? null,
    };
  }

  private async ensureBalance(userId: string) {
    const existing = await this.db.userAzBalance.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.db.userAzBalance.create({
      data: { userId, balance: 0, maxAvailableAz: 0 },
    });
  }

  private async getLatestAwardForSource(userId: string, sourceType: string, sourceId: string) {
    return this.db.azLedgerEntry.findFirst({
      where: {
        userId,
        sourceType,
        sourceId,
        kind: { in: ["INITIAL", "REPEAT", "REGRADE", "RULE_RECALC"] },
        awardedAz: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private async loadRuleByVersionId(ruleVersionId: string): Promise<RuleWithVersion> {
    const version = await this.db.azRewardRuleVersion.findUniqueOrThrow({
      where: { id: ruleVersionId },
      include: { ranges: true, rule: true },
    });
    return {
      ...version.rule,
      versions: [version],
    };
  }

  private async recalculateRewardsForRule(params: {
    ruleId: string;
    toVersionId: string;
    createdById?: string | null;
  }) {
    const version = await this.db.azRewardRuleVersion.findUniqueOrThrow({
      where: { id: params.toVersionId },
      include: { ranges: true },
    });

    // Latest award per user+source for this rule
    const entries = await this.db.azLedgerEntry.findMany({
      where: {
        ruleId: params.ruleId,
        kind: { in: ["INITIAL", "REPEAT", "REGRADE", "RULE_RECALC"] },
        awardedAz: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    const latestByKey = new Map<string, (typeof entries)[number]>();
    for (const e of entries) {
      const key = `${e.userId}:${e.sourceType}:${e.sourceId}`;
      if (!latestByKey.has(key)) latestByKey.set(key, e);
    }

    let processed = 0;
    let adjusted = 0;

    for (const latest of latestByKey.values()) {
      processed += 1;
      const previous = latest.awardedAz ?? 0;
      // Preserve quality ratio when possible
      const ratio = latest.maxAz && latest.maxAz > 0 ? previous / latest.maxAz : 1;
      const proposed = version.allowsPartial
        ? Math.round(version.maxAz * ratio)
        : previous > 0
          ? version.maxAz
          : 0;

      const result = await this.recalculateReward({
        userId: latest.userId,
        sourceType: latest.sourceType,
        sourceId: latest.sourceId,
        newAmount: proposed,
        qualityLabel: latest.qualityLabel,
        reason: `Rule recalculation to version ${version.version}`,
        idempotencyKey: `recalc:${params.toVersionId}:${latest.userId}:${latest.sourceType}:${latest.sourceId}`,
        createdById: params.createdById,
        kind: "RULE_RECALC",
      });

      if (!result.idempotentReplay && result.entry.delta !== 0) adjusted += 1;
    }

    await this.db.azRecalculationJob.create({
      data: {
        ruleId: params.ruleId,
        fromVersion: version.version - 1,
        toVersion: version.version,
        status: "COMPLETED",
        createdById: params.createdById ?? null,
        resultJson: JSON.stringify({ processed, adjusted }),
        completedAt: new Date(),
      },
    });

    return { processed, adjusted };
  }

  private async calculateMaxAvailableAz(): Promise<number> {
    const rules = await this.db.azRewardRule.findMany({
      where: { active: true },
      include: {
        versions: {
          where: { active: true },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });
    return rules.reduce((sum, r) => sum + (r.versions[0]?.maxAz ?? 0), 0);
  }

  private async countCompletedModules(userId: string) {
    const rows = await this.db.azLedgerEntry.groupBy({
      by: ["sourceId"],
      where: {
        userId,
        actionType: "LESSON_COMPLETED",
        kind: { in: ["INITIAL", "REPEAT", "REGRADE", "RULE_RECALC"] },
      },
    });
    return rows.length;
  }

  private async avgAwardedForAction(userId: string, actionType: AzActionType) {
    const rows = await this.db.azLedgerEntry.findMany({
      where: {
        userId,
        actionType,
        kind: { in: ["INITIAL", "REPEAT", "REGRADE", "RULE_RECALC"] },
        awardedAz: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });
    const latest = new Map<string, number>();
    for (const r of rows) {
      const key = `${r.sourceType}:${r.sourceId}`;
      if (!latest.has(key) && r.awardedAz != null) latest.set(key, r.awardedAz);
    }
    if (latest.size === 0) return 0;
    const values = [...latest.values()];
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private async firstAwardDate(userId: string, actionType: AzActionType) {
    const row = await this.db.azLedgerEntry.findFirst({
      where: { userId, actionType, kind: "INITIAL" },
      orderBy: { createdAt: "asc" },
    });
    return row?.createdAt ?? null;
  }

  private compareTieBreak(
    a: {
      totalAz: number;
      modulesCompleted: number;
      assignmentsAvgAz: number;
      quizAvgAz: number;
      simulationAvgAz: number;
      certificationDate: Date | null;
    },
    b: typeof a,
    criterion: TieBreakCriterion,
    descending: boolean,
  ) {
    const dir = descending ? 1 : -1;
    switch (criterion) {
      case "TOTAL_AZ":
        return (b.totalAz - a.totalAz) * dir;
      case "MODULES_COMPLETED":
        return (b.modulesCompleted - a.modulesCompleted) * dir;
      case "ASSIGNMENTS_AVG_AZ":
        return (b.assignmentsAvgAz - a.assignmentsAvgAz) * dir;
      case "QUIZ_AVG_AZ":
        return (b.quizAvgAz - a.quizAvgAz) * dir;
      case "SIMULATION_AVG_AZ":
        return (b.simulationAvgAz - a.simulationAvgAz) * dir;
      case "CERTIFICATION_DATE": {
        const at = a.certificationDate?.getTime() ?? Number.POSITIVE_INFINITY;
        const bt = b.certificationDate?.getTime() ?? Number.POSITIVE_INFINITY;
        // Earlier certification wins when descending=true (lower timestamp first)
        return (at - bt) * (descending ? 1 : -1);
      }
      default:
        return 0;
    }
  }
}

export function createAZService(db: DbClient = defaultPrisma) {
  return new AZService(db);
}
