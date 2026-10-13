"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitAssessmentAction } from "@/app/actions/learning";
import {
  parseAssessmentContent,
  type AssessmentQuestion,
} from "@/lib/lesson-content";

type Props = {
  moduleSlug: string;
  title: string;
  passScore: number;
  content: unknown;
  previousScore: number | null;
  previousPassed: boolean | null;
  /** Free-text already sent to curator (from prior attempt / submission) */
  alreadySentToCurator?: boolean;
};

export function AssessmentForm(props: Props) {
  const router = useRouter();
  const questions = parseAssessmentContent(props.content);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [freeText, setFreeText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentToCurator, setSentToCurator] = useState(Boolean(props.alreadySentToCurator));
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    passScore: number;
  } | null>(
    props.previousScore != null
      ? {
          score: props.previousScore,
          passed: Boolean(props.previousPassed),
          passScore: props.passScore,
        }
      : null,
  );
  const [pending, startTransition] = useTransition();
  const [showFormAgain, setShowFormAgain] = useState(false);

  const done = result != null && sentToCurator && !showFormAgain;

  function setAnswer(id: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await submitAssessmentAction({
          moduleSlug: props.moduleSlug,
          answers,
          freeText: freeText.trim() || undefined,
        });
        setResult({ score: res.score, passed: res.passed, passScore: res.passScore });
        setSentToCurator(Boolean(res.sentToCurator));
        setShowFormAgain(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось отправить");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-16">
      <header className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--cyan)]">
          Модуль · Финальная проверка
        </p>
        <h1
          className="text-2xl font-black text-[var(--text)] md:text-3xl"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {props.title}
        </h1>
        <p className="text-sm font-bold text-[var(--muted)] md:text-base">
          Автопроверка + ответ своими словами для куратора. Проходной балл: {props.passScore}%.
        </p>
      </header>

      {result || sentToCurator ? (
        <div
          className={cn(
            "rounded-2xl border p-5 md:p-6",
            result?.passed !== false
              ? "border-emerald-400/50 bg-emerald-50/90"
              : "border-amber-400/50 bg-amber-50/90",
          )}
        >
          {sentToCurator ? (
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.45)]">
                <Check className="h-6 w-6" strokeWidth={3} />
              </span>
              <div>
                <p className="text-base font-black text-emerald-900">Отправлено куратору</p>
                <p className="text-sm font-bold text-emerald-800/80">
                  Свободный ответ на проверке. Баллы за него начислит куратор.
                </p>
              </div>
            </div>
          ) : null}

          {result ? (
            <>
              <p className="text-lg font-black text-[var(--text)]">
                Авточасть: {result.score}% {result.passed ? "— зачёт" : "— пока не зачёт"}
              </p>
              {!result.passed ? (
                <p className="mt-1 text-sm font-bold text-amber-900/80">
                  Нужно минимум {result.passScore}%. Можно пересдать.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {done ? (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/academy/${props.moduleSlug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--cyan)] px-5 py-3 text-sm font-black text-[#fff]"
          >
            К модулю
          </Link>
          <button
            type="button"
            onClick={() => setShowFormAgain(true)}
            className="rounded-xl border border-[var(--line-strong)] px-4 py-3 text-sm font-black text-[var(--text)]"
          >
            Сдать ещё раз
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                index={idx + 1}
                question={q}
                value={answers[q.id]}
                freeText={freeText}
                onFreeText={setFreeText}
                onChange={(v) => setAnswer(q.id, v)}
              />
            ))}
          </div>

          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--cyan)] px-5 py-3 text-sm font-black text-[#fff] shadow-[0_0_16px_rgba(3,205,253,0.35)] disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {result ? "Отправить снова" : "Отправить ответы"}
            </button>
            <Link
              href={`/academy/${props.moduleSlug}`}
              className="rounded-xl border border-[var(--line-strong)] px-4 py-3 text-sm font-black text-[var(--text)]"
            >
              К модулю
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  question,
  value,
  freeText,
  onFreeText,
  onChange,
}: {
  index: number;
  question: AssessmentQuestion;
  value: unknown;
  freeText: string;
  onFreeText: (v: string) => void;
  onChange: (v: unknown) => void;
}) {
  if (question.type === "freeText") {
    return (
      <div className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-4 md:p-5">
        <p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
          Вопрос {index} · куратор
        </p>
        <p className="mt-2 text-base font-black text-[var(--text)]">{question.prompt}</p>
        {question.hint ? (
          <p className="mt-1 text-sm font-bold text-[var(--muted)]">{question.hint}</p>
        ) : null}
        <textarea
          value={freeText}
          onChange={(e) => onFreeText(e.target.value)}
          rows={6}
          className="mt-3 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 py-2 text-sm font-bold text-[var(--text)] outline-none focus:border-[var(--cyan)] md:text-base"
          placeholder="Напишите ответ своими словами…"
        />
      </div>
    );
  }

  if (question.type === "matching") {
    const rights = question.pairs.map((p) => p.right);
    const current = (value as Record<string, string>) ?? {};
    return (
      <div className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-4 md:p-5">
        <p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">Вопрос {index}</p>
        <p className="mt-2 text-base font-black text-[var(--text)]">{question.prompt}</p>
        <div className="mt-3 space-y-3">
          {question.pairs.map((pair) => (
            <label key={pair.left} className="block">
              <span className="text-sm font-black text-[var(--text)]">{pair.left}</span>
              <select
                className="mt-1 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 py-2 text-sm font-bold text-[var(--text)]"
                value={current[pair.left] ?? ""}
                onChange={(e) => onChange({ ...current, [pair.left]: e.target.value })}
              >
                <option value="">Выберите…</option>
                {rights.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    );
  }

  const options =
    question.type === "findError"
      ? question.statements
      : question.type === "mcq" || question.type === "scenario"
        ? question.options
        : [];

  return (
    <div className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-4 md:p-5">
      <p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
        Вопрос {index}
        {question.type === "findError" ? " · найдите ошибку" : ""}
        {question.type === "scenario" ? " · сценарий" : ""}
      </p>
      <p className="mt-2 text-base font-black text-[var(--text)]">{question.prompt}</p>
      <div className="mt-3 space-y-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "w-full rounded-xl border px-3 py-2.5 text-left text-sm font-bold md:text-base",
              value === opt.id
                ? "border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--text)]"
                : "border-[var(--line-strong)] bg-white text-[var(--text)] hover:border-[var(--cyan)]/40",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
