"use client";

import { cn } from "@/lib/utils";
import type { LessonBlock } from "@/lib/lesson-content";

export type CheckpointState = Record<string, unknown>;

type Props = {
  blocks: LessonBlock[];
  checkpoint: CheckpointState;
  onCheckpointChange: (next: CheckpointState) => void;
  readOnly?: boolean;
};

export function sectionAnchorId(index: number) {
  return `lesson-section-${index}`;
}

/** Labels for in-lesson table of contents */
export function lessonTocEntries(blocks: LessonBlock[]): Array<{ id: string; label: string }> {
  const entries: Array<{ id: string; label: string }> = [];
  blocks.forEach((block, i) => {
    if (block.type === "bulletList" && block.title) {
      entries.push({ id: sectionAnchorId(i), label: block.title });
    } else if (block.type === "summary") {
      entries.push({ id: sectionAnchorId(i), label: block.title ?? "Коротко" });
    } else if (block.type === "knowledgeCheck") {
      entries.push({ id: sectionAnchorId(i), label: "Проверка" });
    } else if (block.type === "scenarioChoice") {
      entries.push({ id: sectionAnchorId(i), label: "Сценарий" });
    } else if (block.type === "flowDiagram" && block.title) {
      entries.push({ id: sectionAnchorId(i), label: block.title });
    } else if (block.type === "problemSolution" && block.title) {
      entries.push({ id: sectionAnchorId(i), label: block.title });
    } else if (block.type === "splitExistsVsPlan") {
      entries.push({ id: sectionAnchorId(i), label: "Есть / в плане" });
    } else if (block.type === "ecosystemMap" && block.title) {
      entries.push({ id: sectionAnchorId(i), label: block.title });
    } else if (block.type === "audiencePicker") {
      entries.push({ id: sectionAnchorId(i), label: block.title });
    }
  });
  return entries;
}

export function BlockRenderer({ blocks, checkpoint, onCheckpointChange, readOnly }: Props) {
  return (
    <div className="az-prose az-lesson-stack">
      {blocks.map((block, i) => (
        <section key={`${block.type}-${i}`} id={sectionAnchorId(i)} className="az-section">
          <Block
            block={block}
            checkpoint={checkpoint}
            onCheckpointChange={onCheckpointChange}
            readOnly={readOnly}
          />
        </section>
      ))}
    </div>
  );
}

function Block({
  block,
  checkpoint,
  onCheckpointChange,
  readOnly,
}: {
  block: LessonBlock;
  checkpoint: CheckpointState;
  onCheckpointChange: (next: CheckpointState) => void;
  readOnly?: boolean;
}) {
  switch (block.type) {
    case "hero":
      return (
        <header className="space-y-3 border-b border-[var(--read-rule)] pb-6">
          <h1 className="az-prose-h1">{block.title}</h1>
          {block.subtitle ? <p className="az-prose-lead m-0">{block.subtitle}</p> : null}
        </header>
      );

    case "callout":
      return (
        <aside className="az-note" data-tone={block.tone === "info" ? undefined : block.tone}>
          {block.title ? <p className="az-note-title">{block.title}</p> : null}
          <p className="az-note-body">{block.body}</p>
        </aside>
      );

    case "paragraph":
      return <p className="m-0">{block.body}</p>;

    case "bulletList":
      return (
        <div>
          {block.title ? <h2 className="az-prose-h2">{block.title}</h2> : null}
          <ul className="az-prose-list">
            {block.items.map((item) => (
              <li key={item}>
                <span className="az-bullet" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "splitExistsVsPlan":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
            <h2 className="az-prose-h2 !text-base text-emerald-900">{block.existsTitle}</h2>
            <ul className="az-prose-list">
              {block.exists.map((x) => (
                <li key={x}>
                  <span className="az-bullet !bg-emerald-600" aria-hidden />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
            <h2 className="az-prose-h2 !text-base text-amber-950">{block.planTitle}</h2>
            <ul className="az-prose-list">
              {block.plan.map((x) => (
                <li key={x}>
                  <span className="az-bullet !bg-amber-600" aria-hidden />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case "openQuestion":
      return (
        <aside className="rounded-xl border border-dashed border-[var(--read-rule)] bg-white/60 px-4 py-3.5">
          <p className="az-prose-meta m-0">{block.title}</p>
          <p className="mt-2 m-0">{block.body}</p>
          {block.needsFromBusiness?.length ? (
            <ul className="az-prose-list mt-3 border-t border-[var(--read-rule)] pt-3">
              {block.needsFromBusiness.map((n) => (
                <li key={n}>
                  <span className="az-bullet" aria-hidden />
                  <span className="text-[0.95em] text-[var(--read-muted)]">{n}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      );

    case "flowDiagram":
      return (
        <div>
          {block.title ? <h2 className="az-prose-h2">{block.title}</h2> : null}
          <ol className="m-0 flex list-none flex-col gap-2 p-0 md:flex-row md:flex-wrap md:items-center md:gap-x-1 md:gap-y-2">
            {block.steps.map((step, idx) => (
              <li key={`${step}-${idx}`} className="flex items-center gap-2 md:gap-1.5">
                <span className="rounded-lg border border-[var(--read-rule)] bg-white/90 px-3 py-2 text-[0.95em] font-semibold text-[var(--read-ink)]">
                  {step}
                </span>
                {idx < block.steps.length - 1 ? (
                  <>
                    <span className="hidden text-[var(--read-muted)] md:inline" aria-hidden>
                      →
                    </span>
                    <span className="text-[var(--read-muted)] md:hidden" aria-hidden>
                      ↓
                    </span>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      );

    case "ecosystemMap":
      return (
        <EcosystemMapBlock
          block={block}
          selectedId={(checkpoint["eco:selected"] as string) ?? null}
          onSelect={(id) => onCheckpointChange({ ...checkpoint, "eco:selected": id })}
        />
      );

    case "audiencePicker":
      return (
        <AudiencePickerBlock
          block={block}
          selectedId={(checkpoint["aud:selected"] as string) ?? null}
          onSelect={(id) => onCheckpointChange({ ...checkpoint, "aud:selected": id })}
        />
      );

    case "scenarioChoice": {
      const key = `sc:${block.id}`;
      const state = checkpoint[key] as { optionId?: string; correct?: boolean; mistakes?: number } | undefined;
      const hasQuality = block.options.some((o) => o.qualityAz != null);
      const passIds = block.passOptionIds?.length ? block.passOptionIds : [block.correctOptionId];
      return (
        <ChoiceBlock
          title={hasQuality ? "Сценарий" : "Сценарий"}
          prompt={block.prompt}
          options={block.options}
          selectedId={state?.optionId}
          correctId={block.correctOptionId}
          passIds={passIds}
          explanation={block.explanation}
          revealed={Boolean(state?.optionId && (state.correct || passIds.includes(state.optionId)))}
          disabled={readOnly}
          qualityMode={hasQuality}
          onPick={(optionId) => {
            if (readOnly) return;
            const passed = passIds.includes(optionId);
            const prevMistakes = state?.mistakes ?? 0;
            onCheckpointChange({
              ...checkpoint,
              [key]: {
                optionId,
                correct: passed,
                mistakes: passed ? prevMistakes : prevMistakes + 1,
              },
            });
          }}
        />
      );
    }

    case "problemSolution":
      return (
        <div className="space-y-3">
          {block.title ? <h2 className="az-prose-h2">{block.title}</h2> : null}
          {block.pairs.map((pair) => (
            <div
              key={pair.problem}
              className="grid gap-3 rounded-xl border border-[var(--read-rule)] bg-white/70 p-4 md:grid-cols-2 md:gap-5"
            >
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--read-muted)]">
                  Проблема
                </p>
                <p className="mt-1.5 m-0 font-medium">{pair.problem}</p>
              </div>
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[var(--cyan)]">
                  Решение
                </p>
                <p className="mt-1.5 m-0 font-medium">{pair.solution}</p>
              </div>
            </div>
          ))}
        </div>
      );

    case "knowledgeCheck": {
      const key = `kc:${block.id}`;
      const state = checkpoint[key] as { optionId?: string; correct?: boolean; mistakes?: number } | undefined;
      return (
        <ChoiceBlock
          title="Проверка"
          prompt={block.question}
          options={block.options}
          selectedId={state?.optionId}
          correctId={block.correctOptionId}
          explanation={block.explanation}
          revealed={Boolean(state?.optionId)}
          disabled={readOnly}
          onPick={(optionId) => {
            if (readOnly) return;
            const correct = optionId === block.correctOptionId;
            const prevMistakes = state?.mistakes ?? 0;
            onCheckpointChange({
              ...checkpoint,
              [key]: {
                optionId,
                correct,
                mistakes: correct ? prevMistakes : prevMistakes + 1,
              },
            });
          }}
        />
      );
    }

    case "summary":
      return (
        <div className="rounded-xl border border-[var(--read-rule)] bg-slate-50/80 px-4 py-4 md:px-5">
          <h2 className="az-prose-h2">{block.title ?? "Коротко"}</h2>
          <ul className="az-prose-list">
            {block.items.map((item) => (
              <li key={item}>
                <span className="mt-[0.35em] shrink-0 font-semibold text-[var(--cyan)]" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    default:
      return null;
  }
}

function ChoiceBlock({
  title,
  prompt,
  options,
  selectedId,
  correctId,
  passIds,
  explanation,
  revealed,
  disabled,
  qualityMode,
  onPick,
}: {
  title: string;
  prompt: string;
  options: { id: string; label: string; qualityAz?: number }[];
  selectedId?: string;
  correctId: string;
  passIds?: string[];
  explanation: string;
  revealed: boolean;
  disabled?: boolean;
  qualityMode?: boolean;
  onPick: (id: string) => void;
}) {
  const accepted = passIds?.length ? passIds : [correctId];
  const isPassed = selectedId != null && accepted.includes(selectedId);
  const isBest = selectedId === correctId;
  const locked = Boolean(disabled || (revealed && isPassed));
  return (
    <div className="az-interactive">
      <p className="az-prose-meta m-0">{title}</p>
      <p className="mt-2 m-0 text-[1.05em] font-semibold leading-snug text-[var(--read-ink)]">{prompt}</p>
      <div className="mt-3.5 space-y-2" role="group" aria-label={prompt}>
        {options.map((opt) => {
          const selected = selectedId === opt.id;
          const showBest = revealed && isPassed && opt.id === correctId;
          const showOk =
            revealed && isPassed && selected && opt.id !== correctId && accepted.includes(opt.id);
          const showWrong = revealed && selected && !isPassed;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={locked}
              onClick={() => onPick(opt.id)}
              className={cn(
                "w-full rounded-xl border px-3.5 py-3 text-left text-[0.98em] font-medium leading-snug transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]",
                showBest && "border-emerald-500 bg-emerald-50 text-[var(--read-ink)]",
                showOk && "border-amber-400 bg-amber-50 text-[var(--read-ink)]",
                showWrong && "border-red-400 bg-red-50 text-[var(--read-ink)]",
                !showBest &&
                  !showOk &&
                  !showWrong &&
                  selected &&
                  "border-slate-400 bg-slate-50 text-[var(--read-ink)]",
                !showBest &&
                  !showOk &&
                  !showWrong &&
                  !selected &&
                  "border-[var(--read-rule)] bg-white hover:border-slate-300",
                locked && "cursor-default",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {revealed ? (
        <p
          className={cn(
            "mt-3.5 m-0 text-[0.95em] leading-relaxed",
            isPassed ? "text-emerald-800" : "text-red-700",
          )}
        >
          {isPassed
            ? `${isBest ? "Отлично." : qualityMode ? "Принято, но есть вариант сильнее." : "Верно."} ${explanation}`
            : "Неверно. Выберите другой вариант."}
        </p>
      ) : null}
    </div>
  );
}

function EcosystemMapBlock({
  block,
  selectedId,
  onSelect,
}: {
  block: Extract<LessonBlock, { type: "ecosystemMap" }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = block.actors.find((a) => a.id === selectedId) ?? null;
  return (
    <div className="space-y-4">
      {block.title ? <h2 className="az-prose-h2">{block.title}</h2> : null}
      {block.intro ? <p className="m-0 text-[var(--read-muted)]">{block.intro}</p> : null}
      <div className="flex flex-wrap justify-center gap-2 rounded-xl border border-[var(--read-rule)] bg-white/70 p-4 md:gap-3 md:p-5">
        {block.actors.map((actor) => (
          <button
            key={actor.id}
            type="button"
            onClick={() => onSelect(actor.id)}
            className={cn(
              "rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]",
              selectedId === actor.id
                ? "border-[var(--cyan)] bg-sky-50 text-[var(--read-ink)]"
                : "border-[var(--read-rule)] bg-white text-[var(--read-ink)] hover:border-slate-300",
            )}
          >
            {actor.label}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="space-y-2 rounded-xl border border-[var(--read-rule)] bg-white/85 p-4">
          <p className="m-0 text-lg font-semibold">{selected.label}</p>
          <p className="m-0">
            <span className="text-[var(--read-muted)]">Кто: </span>
            {selected.who}
          </p>
          <p className="m-0">
            <span className="text-[var(--read-muted)]">Что получает: </span>
            {selected.gets}
          </p>
          <p className="m-0">
            <span className="text-[var(--read-muted)]">Как взаимодействует: </span>
            {selected.interacts}
          </p>
        </div>
      ) : (
        <p className="m-0 text-center text-sm text-[var(--read-muted)]">Нажмите на участника</p>
      )}
      {block.flows?.map((flow) => (
        <div key={flow.title} className="rounded-xl border border-[var(--read-rule)] bg-white/70 p-4">
          <p className="mb-1.5 m-0 font-semibold">{flow.title}</p>
          <p className="m-0 text-[var(--read-muted)]">{flow.steps.join(" → ")}</p>
        </div>
      ))}
    </div>
  );
}

function AudiencePickerBlock({
  block,
  selectedId,
  onSelect,
}: {
  block: Extract<LessonBlock, { type: "audiencePicker" }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = block.options.find((o) => o.id === selectedId) ?? null;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="az-prose-h2">{block.title}</h2>
        {block.intro ? <p className="m-0 text-[var(--read-muted)]">{block.intro}</p> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {block.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={cn(
              "rounded-xl border px-3 py-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]",
              selectedId === opt.id
                ? "border-[var(--cyan)] bg-sky-50 text-[var(--read-ink)]"
                : "border-[var(--read-rule)] bg-white text-[var(--read-ink)] hover:border-slate-300",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="rounded-xl border border-[var(--read-rule)] bg-white/80 p-4">
          <p className="m-0 font-semibold">Ценность для «{selected.label}»</p>
          <ul className="az-prose-list mt-2">
            {selected.value.map((v) => (
              <li key={v}>
                <span className="az-bullet" aria-hidden />
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
