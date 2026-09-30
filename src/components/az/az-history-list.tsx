import { formatAz } from "@/lib/utils";
import type { AzHistoryItem } from "@server/az/az-service";

const kindLabel: Record<string, string> = {
  INITIAL: "Первоначальная оценка",
  REPEAT: "Повторное получение",
  REGRADE: "Переоценка",
  RULE_RECALC: "Пересчёт правила",
  AUTO_REDUCTION: "Автоматическое уменьшение",
};

export function AzHistoryList({ items }: { items: AzHistoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">История AZ пока пуста.</p>;
  }

  return (
    <ol className="relative border-l border-[var(--line-strong)] pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative pb-8 last:pb-0">
          <span
            className="absolute -left-[1.64rem] top-1.5 h-2.5 w-2.5 rounded-[1px]"
            style={{
              background: item.delta >= 0 ? "var(--accent)" : "var(--bad)",
            }}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--ink)]">
                {item.sourceType} · {item.actionType}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                {kindLabel[item.kind] ?? item.kind}
              </p>
            </div>
            <p
              className="text-lg font-extrabold tabular-nums"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                color: item.delta >= 0 ? "var(--ok)" : "var(--bad)",
              }}
            >
              {item.delta >= 0 ? "+" : ""}
              {formatAz(item.delta)} AZ
            </p>
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {item.maxAz != null ? (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Максимум
                </dt>
                <dd className="mt-1 font-medium">{formatAz(item.maxAz)} AZ</dd>
              </div>
            ) : null}
            {item.awardedAz != null ? (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Получено
                </dt>
                <dd className="mt-1 font-medium">{formatAz(item.awardedAz)} AZ</dd>
              </div>
            ) : null}
            {item.previousAwardedAz != null ? (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Было → Стало
                </dt>
                <dd className="mt-1 font-medium">
                  {formatAz(item.previousAwardedAz)} → {formatAz(item.awardedAz ?? 0)} AZ
                </dd>
              </div>
            ) : null}
            {item.qualityLabel ? (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Качество
                </dt>
                <dd className="mt-1 font-medium">{item.qualityLabel}</dd>
              </div>
            ) : null}
          </dl>

          <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]">
            <span className="text-[var(--muted)]">Причина — </span>
            {item.reason}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {item.createdAt.toLocaleString("ru-RU")} · баланс после: {formatAz(item.balanceAfter)} AZ
          </p>
        </li>
      ))}
    </ol>
  );
}
