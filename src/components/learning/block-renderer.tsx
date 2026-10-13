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

export function BlockRenderer({ blocks, checkpoint, onCheckpointChange, readOnly }: Props) {
  return (
    <div className="space-y-5 md:space-y-6">
      {blocks.map((block, i) => (
        <Block
          key={`${block.type}-${i}`}
          block={block}
          checkpoint={checkpoint}
          onCheckpointChange={onCheckpointChange}
          readOnly={readOnly}
        />
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
      // Eyebrow (Модуль/Урок) intentionally omitted — player chrome already shows it
      return (
        <header className="space-y-2">
          <h1
            className="text-2xl font-black leading-tight text-black md:text-3xl"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {block.title}
          </h1>
          {block.subtitle ? (
            <p className="text-base font-bold text-black/75 md:text-lg">{block.subtitle}</p>
          ) : null}
        </header>
      );

    case "callout": {
      const tone =
        block.tone === "warn"
          ? "border-amber-400/60 bg-amber-50/80"
          : block.tone === "ok"
            ? "border-emerald-400/50 bg-emerald-50/70"
            : "border-[var(--cyan)]/40 bg-cyan-50/60";
      return (
        <aside className={cn("az-glass rounded-2xl border p-4 md:p-5", tone)}>
          {block.title ? <p className="text-sm font-black text-black md:text-base">{block.title}</p> : null}
          <p className={cn("text-sm font-bold leading-relaxed text-black/85 md:text-base", block.title && "mt-1.5")}>
            {block.body}
          </p>
        </aside>
      );
    }

    case "paragraph":
      return <p className="text-base font-bold leading-relaxed text-black/90 md:text-lg">{block.body}</p>;

    case "bulletList":
      return (
        <div className="az-glass rounded-2xl bg-white/75 p-4 md:p-5">
          {block.title ? <p className="mb-2 text-sm font-black text-black md:text-base">{block.title}</p> : null}
          <ul className="space-y-2">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm font-bold text-black/90 md:text-base">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cyan)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "splitExistsVsPlan":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="az-glass rounded-2xl border border-emerald-300/50 bg-white/80 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">{block.existsTitle}</p>
            <ul className="mt-2 space-y-2">
              {block.exists.map((x) => (
                <li key={x} className="text-sm font-bold text-black md:text-base">
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="az-glass rounded-2xl border border-amber-300/50 bg-white/80 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-amber-800">{block.planTitle}</p>
            <ul className="mt-2 space-y-2">
              {block.plan.map((x) => (
                <li key={x} className="text-sm font-bold text-black md:text-base">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case "openQuestion":
      return (
        <aside className="az-glass rounded-2xl border border-dashed border-black/25 bg-white/60 p-4 md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-black/50">{block.title}</p>
          <p className="mt-2 text-sm font-bold leading-relaxed text-black/85 md:text-base">{block.body}</p>
          {block.needsFromBusiness?.length ? (
            <ul className="mt-3 space-y-1 border-t border-black/10 pt-3">
              {block.needsFromBusiness.map((n) => (
                <li key={n} className="text-xs font-bold text-black/60 md:text-sm">
                  → {n}
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      );

    case "flowDiagram":
      return (
        <div className="az-glass rounded-2xl bg-white/75 p-4 md:p-5">
          {block.title ? <p className="mb-3 text-sm font-black text-black md:text-base">{block.title}</p> : null}
          <ol className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-1">
            {block.steps.map((step, idx) => (
              <li key={`${step}-${idx}`} className="flex items-center gap-2 md:gap-1">
                <span className="rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 px-3 py-2 text-sm font-extrabold text-[var(--text)] md:text-base">
                  {step}
                </span>
                {idx < block.steps.length - 1 ? (
                  <span className="hidden text-black/40 md:inline" aria-hidden>
                    →
                  </span>
                ) : null}
                {idx < block.steps.length - 1 ? (
                  <span className="text-black/40 md:hidden" aria-hidden>
                    ↓
                  </span>
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
          title={hasQuality ? "Сценарий · качество ответа" : "Сценарий"}
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
          {block.title ? <p className="text-sm font-black text-black md:text-base">{block.title}</p> : null}
          {block.pairs.map((pair) => (
            <div key={pair.problem} className="az-glass grid gap-2 rounded-2xl bg-white/75 p-4 md:grid-cols-2 md:gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-black/45">Проблема</p>
                <p className="mt-1 text-sm font-bold text-black md:text-base">{pair.problem}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[var(--cyan)]">Решение</p>
                <p className="mt-1 text-sm font-bold text-black md:text-base">{pair.solution}</p>
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
        <div className="az-glass rounded-2xl border border-black/10 bg-white/85 p-4 md:p-5">
          <p className="text-sm font-black text-black md:text-base">{block.title ?? "Коротко"}</p>
          <ul className="mt-2 space-y-2">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm font-bold text-black/90 md:text-base">
                <span className="font-black text-[var(--cyan)]">✓</span>
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
  // Lock only after a passing answer — wrong picks stay retryable
  const locked = Boolean(disabled || (revealed && isPassed));
  return (
    <div className="az-glass rounded-2xl bg-white/80 p-4 md:p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--cyan)]">{title}</p>
      <p className="mt-2 text-base font-black text-black md:text-lg">{prompt}</p>
      <div className="mt-3 space-y-2">
        {options.map((opt) => {
          const selected = selectedId === opt.id;
          const showBest = revealed && isPassed && opt.id === correctId;
          const showOk = revealed && isPassed && selected && opt.id !== correctId && accepted.includes(opt.id);
          const showWrong = revealed && selected && !isPassed;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={locked}
              onClick={() => onPick(opt.id)}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition md:text-base",
                showBest && "border-emerald-500 bg-emerald-50 text-black",
                showOk && "border-amber-400 bg-amber-50 text-black",
                showWrong && "border-red-400 bg-red-50 text-black",
                !showBest && !showOk && !showWrong && selected && "border-black bg-black/5",
                !showBest && !showOk && !showWrong && !selected && "border-black/15 bg-white hover:border-black/40",
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
            "mt-3 text-sm font-bold md:text-base",
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
      {block.title ? <p className="text-sm font-black text-black md:text-base">{block.title}</p> : null}
      {block.intro ? <p className="text-sm font-bold text-black/75 md:text-base">{block.intro}</p> : null}
      <div className="az-glass flex flex-wrap justify-center gap-2 rounded-2xl bg-white/70 p-4 md:gap-3 md:p-6">
        {block.actors.map((actor) => (
          <button
            key={actor.id}
            type="button"
            onClick={() => onSelect(actor.id)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-black transition md:text-base",
              selectedId === actor.id
                ? "border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--text)]"
                : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--cyan)]/50",
            )}
          >
            {actor.label}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="az-glass space-y-2 rounded-2xl bg-white/85 p-4 md:p-5">
          <p className="text-lg font-black text-black">{selected.label}</p>
          <p className="text-sm font-bold text-black/85 md:text-base">
            <span className="text-black/45">Кто: </span>
            {selected.who}
          </p>
          <p className="text-sm font-bold text-black/85 md:text-base">
            <span className="text-black/45">Что получает: </span>
            {selected.gets}
          </p>
          <p className="text-sm font-bold text-black/85 md:text-base">
            <span className="text-black/45">Как взаимодействует: </span>
            {selected.interacts}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm font-bold text-black/50">Нажмите на участника</p>
      )}
      {block.flows?.map((flow) => (
        <div key={flow.title} className="az-glass rounded-2xl bg-white/75 p-4">
          <p className="mb-2 text-sm font-black text-black">{flow.title}</p>
          <p className="text-sm font-bold text-black/80 md:text-base">{flow.steps.join(" → ")}</p>
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
        <p className="text-base font-black text-black md:text-lg">{block.title}</p>
        {block.intro ? <p className="mt-1 text-sm font-bold text-black/70 md:text-base">{block.intro}</p> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {block.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={cn(
              "rounded-2xl border px-3 py-4 text-sm font-black transition md:text-base",
              selectedId === opt.id
                ? "border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--text)]"
                : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--cyan)]/50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-4 md:p-5">
          <p className="text-sm font-black text-[var(--text)]">Ценность для «{selected.label}»</p>
          <ul className="mt-2 space-y-2">
            {selected.value.map((v) => (
              <li key={v} className="flex gap-2 text-sm font-bold text-[var(--text)] md:text-base">
                <span className="text-[var(--cyan)]">•</span>
                <span className="opacity-90">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
