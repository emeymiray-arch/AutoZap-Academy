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
    return (
      <p className="rounded-xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-6 text-sm text-[var(--az-muted)]">
        История AZ пока пуста.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {item.sourceType} · {item.actionType}
              </p>
              <p className="mt-1 text-xs text-[var(--az-muted)]">{kindLabel[item.kind] ?? item.kind}</p>
            </div>
            <p
              className={`text-sm font-semibold tabular-nums ${
                item.delta >= 0 ? "text-[var(--az-success)]" : "text-[var(--az-danger)]"
              }`}
            >
              {item.delta >= 0 ? "+" : ""}
              {formatAz(item.delta)} AZ
            </p>
          </div>

          <dl className="mt-3 grid gap-2 text-sm text-[var(--az-muted)] sm:grid-cols-2">
            {item.maxAz != null ? (
              <div>
                <dt className="text-xs uppercase tracking-wide">Максимум</dt>
                <dd className="text-[var(--az-text)]">{formatAz(item.maxAz)} AZ</dd>
              </div>
            ) : null}
            {item.awardedAz != null ? (
              <div>
                <dt className="text-xs uppercase tracking-wide">Получено</dt>
                <dd className="text-[var(--az-text)]">{formatAz(item.awardedAz)} AZ</dd>
              </div>
            ) : null}
            {item.previousAwardedAz != null ? (
              <div>
                <dt className="text-xs uppercase tracking-wide">Было → Стало</dt>
                <dd className="text-[var(--az-text)]">
                  {formatAz(item.previousAwardedAz)} → {formatAz(item.awardedAz ?? 0)} AZ
                </dd>
              </div>
            ) : null}
            {item.qualityLabel ? (
              <div>
                <dt className="text-xs uppercase tracking-wide">Качество</dt>
                <dd className="text-[var(--az-text)]">{item.qualityLabel}</dd>
              </div>
            ) : null}
          </dl>

          <p className="mt-3 text-sm text-[var(--az-text)]">
            <span className="text-[var(--az-muted)]">Причина: </span>
            {item.reason}
          </p>
          <p className="mt-2 text-xs text-[var(--az-muted)]">
            {item.createdAt.toLocaleString("ru-RU")} · баланс после: {formatAz(item.balanceAfter)} AZ
          </p>
        </li>
      ))}
    </ul>
  );
}
