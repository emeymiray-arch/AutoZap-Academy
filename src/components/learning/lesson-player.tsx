"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  BlockRenderer,
  lessonTocEntries,
  type CheckpointState,
} from "@/components/learning/block-renderer";
import {
  completeLessonAction,
  saveLessonCheckpointAction,
} from "@/app/actions/learning";
import { AdminAzStepper } from "@/components/learning/admin-az-stepper";
import {
  parseLessonContent,
  requiredKnowledgeCheckIds,
  scenarioPassIds,
  type LessonContent,
} from "@/lib/lesson-content";
import { cn } from "@/lib/utils";

type Props = {
  moduleSlug: string;
  moduleTitle: string;
  modulePosition: number;
  lessonSlug: string;
  lessonTitle: string;
  lessonPosition: number;
  lessonCount: number;
  estimatedMinutes: number | null;
  lessonRewardAz: number | null;
  isAdmin?: boolean;
  lessonId?: string;
  moduleId?: string;
  content: unknown;
  initialCheckpoint: CheckpointState;
  completed: boolean;
  prevSlug: string | null;
  nextSlug: string | null;
  nextIsAssessment: boolean;
};

const TEXT_SCALE_KEY = "az_lesson_text_scale";

function gatesPassed(content: LessonContent, checkpoint: CheckpointState): boolean {
  for (const id of requiredKnowledgeCheckIds(content)) {
    const e = checkpoint[`kc:${id}`] as { correct?: boolean } | undefined;
    if (!e?.correct) return false;
  }
  for (const block of content) {
    if (block.type !== "scenarioChoice") continue;
    const e = checkpoint[`sc:${block.id}`] as { optionId?: string; correct?: boolean } | undefined;
    const passIds = scenarioPassIds(block);
    if (!(e?.correct || (e?.optionId != null && passIds.includes(e.optionId)))) return false;
  }
  return true;
}

export function LessonPlayer(props: Props) {
  const router = useRouter();
  const tocId = useId();
  const content = parseLessonContent(props.content);
  const toc = lessonTocEntries(content);
  const [checkpoint, setCheckpoint] = useState<CheckpointState>(props.initialCheckpoint);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(props.completed);
  const [mounted, setMounted] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [textScale, setTextScale] = useState<"md" | "lg">("md");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canComplete = gatesPassed(content, checkpoint);
  const progressPct = Math.round((props.lessonPosition / Math.max(props.lessonCount, 1)) * 100);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(TEXT_SCALE_KEY);
      if (stored === "lg" || stored === "md") setTextScale(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (done) return;
    saveTimer.current = setTimeout(() => {
      void saveLessonCheckpointAction({
        moduleSlug: props.moduleSlug,
        lessonSlug: props.lessonSlug,
        checkpoint,
      }).catch(() => {
        /* ignore transient save errors */
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [checkpoint, done, props.moduleSlug, props.lessonSlug]);

  function toggleTextScale() {
    setTextScale((prev) => {
      const next = prev === "md" ? "lg" : "md";
      try {
        localStorage.setItem(TEXT_SCALE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function handleComplete() {
    setError(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    startTransition(async () => {
      try {
        await completeLessonAction({
          moduleSlug: props.moduleSlug,
          lessonSlug: props.lessonSlug,
          checkpoint,
        });
        setDone(true);
        if (props.nextSlug) {
          router.push(`/academy/${props.moduleSlug}/${props.nextSlug}`);
        } else if (props.nextIsAssessment) {
          router.push(`/academy/${props.moduleSlug}/assessment`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось завершить урок");
      }
    });
  }

  const footer = (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-3 py-2.5 backdrop-blur-md md:px-6">
      <div className="mx-auto flex max-w-[var(--read-measure)] items-center justify-between gap-2">
        {props.prevSlug ? (
          <Link
            href={`/academy/${props.moduleSlug}/${props.prevSlug}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Link>
        ) : (
          <Link
            href={`/academy/${props.moduleSlug}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]"
          >
            <ChevronLeft className="h-4 w-4" />
            К модулю
          </Link>
        )}

        <div className="flex items-center gap-2">
          {!done ? (
            <button
              type="button"
              disabled={!canComplete || pending}
              onClick={handleComplete}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]",
                canComplete && !pending
                  ? "bg-[var(--cyan)] text-white hover:opacity-95"
                  : "border border-slate-200 bg-slate-50 text-slate-400",
              )}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? "Сохраняем…" : "Завершить урок"}
            </button>
          ) : null}
          {done && props.nextSlug ? (
            <Link
              href={`/academy/${props.moduleSlug}/${props.nextSlug}`}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--cyan)] px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]"
            >
              Далее
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
          {done && !props.nextSlug && props.nextIsAssessment ? (
            <Link
              href={`/academy/${props.moduleSlug}/assessment`}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--cyan)] px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]"
            >
              К проверке
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
      {!done && !canComplete ? (
        <p className="mx-auto mt-1.5 max-w-[var(--read-measure)] text-center text-xs font-medium text-slate-500">
          Ответьте на проверки и сценарии, чтобы завершить урок
        </p>
      ) : !done && canComplete ? (
        <p className="mx-auto mt-1.5 max-w-[var(--read-measure)] text-center text-xs font-medium text-slate-600">
          +{props.lessonRewardAz ?? 5} AZ за урок
          {props.lessonRewardAz != null ? " · +1 AZ если всё с первого раза" : ""}
        </p>
      ) : null}
      {error ? (
        <p className="mx-auto mt-1.5 max-w-[var(--read-measure)] text-center text-xs font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </footer>
  );

  return (
    <article className="az-lesson pb-28" data-text-scale={textScale}>
      <div className="mb-1 h-1 overflow-hidden rounded-full bg-slate-200/80" aria-hidden>
        <div
          className="h-full rounded-full bg-[var(--cyan)] transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <nav
        className="mb-5 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600"
        aria-label="Навигация по уроку"
      >
        <Link
          href={`/academy/${props.moduleSlug}`}
          className="font-medium text-slate-700 underline-offset-2 hover:text-slate-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]"
        >
          {props.moduleTitle}
        </Link>
        <span className="text-slate-300" aria-hidden>
          /
        </span>
        <span className="font-medium text-slate-500">
          Урок {props.lessonPosition} из {props.lessonCount}
        </span>
        {props.estimatedMinutes ? (
          <>
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
            <span>~{props.estimatedMinutes} мин</span>
          </>
        ) : null}
        {done ? (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" /> Завершён
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTextScale}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]"
            aria-pressed={textScale === "lg"}
            aria-label={textScale === "lg" ? "Обычный размер текста" : "Увеличить текст"}
            title="Размер текста"
          >
            {textScale === "lg" ? "A−" : "A+"}
          </button>
          {props.isAdmin && props.lessonId && props.moduleId && props.lessonRewardAz != null ? (
            <AdminAzStepper
              kind="lesson"
              lessonId={props.lessonId}
              moduleId={props.moduleId}
              moduleSlug={props.moduleSlug}
              currentAz={props.lessonRewardAz}
              min={0}
              max={50}
              className="normal-case"
            />
          ) : props.lessonRewardAz != null && props.lessonRewardAz > 0 ? (
            <span className="text-xs font-semibold text-slate-500">+{props.lessonRewardAz} AZ</span>
          ) : null}
        </div>
      </nav>

      {toc.length > 1 ? (
        <div className="mb-6 rounded-xl border border-slate-200/90 bg-white/70">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)] md:px-4"
            aria-expanded={tocOpen}
            aria-controls={tocId}
            onClick={() => setTocOpen((v) => !v)}
          >
            Содержание урока
            <ChevronDown
              className={cn("h-4 w-4 text-slate-500 transition", tocOpen && "rotate-180")}
              aria-hidden
            />
          </button>
          <div id={tocId} hidden={!tocOpen} className="border-t border-slate-200/80 px-3.5 py-2.5 md:px-4">
            <ol className="m-0 list-none space-y-1.5 p-0">
              {toc.map((entry, i) => (
                <li key={entry.id}>
                  <a
                    href={`#${entry.id}`}
                    className="block rounded-md px-1.5 py-1 text-sm text-slate-700 underline-offset-2 hover:bg-slate-50 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)]"
                    onClick={() => setTocOpen(false)}
                  >
                    <span className="mr-2 tabular-nums text-slate-400">{i + 1}.</span>
                    {entry.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}

      <BlockRenderer blocks={content} checkpoint={checkpoint} onCheckpointChange={setCheckpoint} />

      {mounted ? createPortal(footer, document.body) : null}
    </article>
  );
}
