"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { BlockRenderer, type CheckpointState } from "@/components/learning/block-renderer";
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

type Props = {
  moduleSlug: string;
  moduleTitle: string;
  modulePosition: number;
  lessonSlug: string;
  lessonTitle: string;
  lessonPosition: number;
  lessonCount: number;
  estimatedMinutes: number | null;
  /** AZ awarded on complete (Module 1 default: 5) */
  lessonRewardAz: number | null;
  /** Admin can tweak AZ inline */
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
  const content = parseLessonContent(props.content);
  const [checkpoint, setCheckpoint] = useState<CheckpointState>(props.initialCheckpoint);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(props.completed);
  const [mounted, setMounted] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canComplete = gatesPassed(content, checkpoint);

  useEffect(() => {
    setMounted(true);
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

  function handleComplete() {
    setError(null);
    // Drop the pending autosave: complete saves the checkpoint itself,
    // and queued server actions would delay this one.
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
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/90 px-3 py-3 backdrop-blur-md md:px-6">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
        {props.prevSlug ? (
          <Link
            href={`/academy/${props.moduleSlug}/${props.prevSlug}`}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--line-strong)] bg-[var(--surface-strong)] px-3 py-2.5 text-sm font-black text-[var(--text)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Link>
        ) : (
          <Link
            href={`/academy/${props.moduleSlug}`}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--line-strong)] bg-[var(--surface-strong)] px-3 py-2.5 text-sm font-black text-[var(--text)]"
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
              className={
                canComplete && !pending
                  ? "inline-flex items-center gap-2 rounded-xl bg-[var(--cyan)] px-4 py-2.5 text-sm font-black text-[#fff] shadow-[0_0_16px_rgba(3,205,253,0.35)]"
                  : "inline-flex items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black text-[var(--muted)]"
              }
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? "Сохраняем…" : "Завершить урок"}
            </button>
          ) : null}
          {done && props.nextSlug ? (
            <Link
              href={`/academy/${props.moduleSlug}/${props.nextSlug}`}
              className="inline-flex items-center gap-1 rounded-xl bg-[var(--cyan)] px-4 py-2.5 text-sm font-black text-[#fff]"
            >
              Далее
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
          {done && !props.nextSlug && props.nextIsAssessment ? (
            <Link
              href={`/academy/${props.moduleSlug}/assessment`}
              className="inline-flex items-center gap-1 rounded-xl bg-[var(--cyan)] px-4 py-2.5 text-sm font-black text-[#fff]"
            >
              К проверке
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
      {!done && !canComplete ? (
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs font-bold text-[var(--muted)]">
          Ответьте на проверки и сценарии, чтобы завершить урок
        </p>
      ) : !done && canComplete ? (
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs font-bold text-[var(--cyan)]">
          +{props.lessonRewardAz ?? 5} AZ за урок
          {props.lessonRewardAz != null ? " · +1 AZ если всё с первого раза" : ""}
        </p>
      ) : null}
      {error ? (
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs font-bold text-red-600">{error}</p>
      ) : null}
    </footer>
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pb-28">
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--cyan)] md:text-sm">
        <Link href={`/academy/${props.moduleSlug}`} className="hover:opacity-80">
          Модуль {String(props.modulePosition).padStart(2, "0")}
        </Link>
        <span className="text-[var(--cyan)]/50" aria-hidden>
          ·
        </span>
        <span>
          Урок {props.lessonPosition}/{props.lessonCount}
        </span>
        {props.estimatedMinutes ? (
          <>
            <span className="text-[var(--cyan)]/50" aria-hidden>
              ·
            </span>
            <span>~{props.estimatedMinutes} мин</span>
          </>
        ) : null}
        {props.isAdmin && props.lessonId && props.moduleId && props.lessonRewardAz != null ? (
          <>
            <span className="text-[var(--cyan)]/50" aria-hidden>
              ·
            </span>
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
          </>
        ) : props.lessonRewardAz != null && props.lessonRewardAz > 0 ? (
          <>
            <span className="text-[var(--cyan)]/50" aria-hidden>
              ·
            </span>
            <span className="normal-case tracking-normal">+{props.lessonRewardAz} AZ</span>
          </>
        ) : null}
        {done ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 normal-case tracking-normal">
            <Check className="h-3.5 w-3.5" /> Завершён
          </span>
        ) : null}
      </div>

      <BlockRenderer blocks={content} checkpoint={checkpoint} onCheckpointChange={setCheckpoint} />

      {/* Portal: AppShell wraps pages in a transformed container, which breaks position:fixed */}
      {mounted ? createPortal(footer, document.body) : null}
    </div>
  );
}
