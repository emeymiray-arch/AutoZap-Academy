import { AppShell } from "@/components/layout/app-shell";
import {
  getAdminAzOverview,
  publishAzRuleVersionAction,
  runFinalRankingAction,
  setModuleMaxOverrideAction,
} from "@/app/actions/az";
import { formatAz } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAzPage() {
  const adminId = process.env.DEMO_ADMIN_ID ?? "admin-demo-001";
  const { rules, levels, tieBreaks, students, moduleMaximums } = await getAdminAzOverview();

  return (
    <AppShell
      eyebrow="CMS"
      title="Управление AZ"
      subtitle="Правила наград, уровни, максимумы модулей и финальный рейтинг. Ручное изменение баланса ученика запрещено."
    >
      <section className="mb-14">
        <h3
          className="mb-5 text-xl font-bold"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Ученики
        </h3>
        <table className="az-table">
          <thead>
            <tr>
              <th>Ученик</th>
              <th>AZ</th>
              <th>Max available</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.userId}>
                <td className="font-medium">{s.user.name}</td>
                <td className="tabular-nums font-semibold">{formatAz(s.balance)}</td>
                <td className="tabular-nums">{formatAz(s.maxAvailableAz)}</td>
                <td>{s.level?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-14">
        <h3
          className="mb-5 text-xl font-bold"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Reward rules
        </h3>
        <div className="divide-y divide-[var(--line-strong)] border-y border-[var(--line-strong)]">
          {rules.map((rule) => {
            const version = rule.versions[0];
            return (
              <article key={rule.id} className="py-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4
                      className="text-lg font-bold"
                      style={{ fontFamily: "var(--font-display), sans-serif" }}
                    >
                      {rule.name}
                    </h4>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {rule.actionType} · {rule.scopeType} · v{rule.currentVersion} ·{" "}
                      {rule.active ? "active" : "inactive"}
                    </p>
                    <p className="mt-3 text-sm">
                      Max <strong>{version?.maxAz ?? "—"} AZ</strong>
                      {" · "}partial {version?.allowsPartial ? "yes" : "no"}
                      {" · "}repeat {version?.allowsRepeat ? "yes" : "no"}
                      {" · "}quality {version?.qualityDependent ? "yes" : "no"}
                    </p>
                    {version?.ranges?.length ? (
                      <ul className="mt-2 text-sm text-[var(--muted)]">
                        {version.ranges.map((r) => (
                          <li key={r.id}>
                            {r.label}: {r.minAz}–{r.maxAz}
                            {r.criteria ? ` (${r.criteria})` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>

                {version ? (
                  <form
                    action={publishAzRuleVersionAction}
                    className="mt-6 grid gap-4 border-t border-[var(--line)] pt-6 md:grid-cols-4"
                  >
                    <input type="hidden" name="ruleId" value={rule.id} />
                    <input type="hidden" name="adminId" value={adminId} />
                    <input
                      type="hidden"
                      name="qualityDependent"
                      value={String(version.qualityDependent)}
                    />
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      New max AZ
                      <input
                        name="maxAz"
                        type="number"
                        min={0}
                        defaultValue={version.maxAz}
                        className="az-input mt-2"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--muted)] md:pt-7">
                      <input
                        name="allowsPartial"
                        type="checkbox"
                        defaultChecked={version.allowsPartial}
                      />
                      Partial
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--muted)] md:pt-7">
                      <input
                        name="allowsRepeat"
                        type="checkbox"
                        defaultChecked={version.allowsRepeat}
                      />
                      Repeat
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Apply mode
                      <select name="applyMode" defaultValue="FUTURE_ONLY" className="az-input mt-2">
                        <option value="FUTURE_ONLY">Только будущие действия</option>
                        <option value="RECALCULATE_EXISTING">Пересчитать выполненные</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:col-span-3">
                      Note
                      <input
                        name="note"
                        placeholder="Причина новой версии"
                        className="az-input mt-2"
                      />
                    </label>
                    <button type="submit" className="az-btn self-end">
                      Publish version
                    </button>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mb-14 grid gap-10 lg:grid-cols-2">
        <div>
          <h3
            className="mb-4 text-xl font-bold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Level rules
          </h3>
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
            {levels.map((level) => (
              <li key={level.id} className="flex justify-between gap-3 py-3">
                <span>
                  <strong>{level.name}</strong>{" "}
                  <span className="text-[var(--muted)]">({level.slug})</span>
                </span>
                <span className="tabular-nums text-[var(--muted)]">
                  {level.minAz}
                  {level.maxAz != null ? `–${level.maxAz - 1}` : "+"} AZ
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3
            className="mb-4 text-xl font-bold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Tie-break
          </h3>
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
            {tieBreaks.map((rule) => (
              <li key={rule.id} className="flex justify-between gap-3 py-3">
                <span>
                  #{rule.priority} {rule.criterion}
                </span>
                <span className="text-[var(--muted)]">
                  {rule.descending ? "desc" : "asc"} · {rule.active ? "active" : "off"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-14">
        <h3
          className="mb-5 text-xl font-bold"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Module maximum AZ
        </h3>
        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {moduleMaximums.slice(0, 3).map(({ module, maximum }) => (
            <form
              key={module.id}
              action={setModuleMaxOverrideAction}
              className="flex flex-wrap items-end gap-4 py-5"
            >
              <input type="hidden" name="adminId" value={adminId} />
              <input type="hidden" name="moduleId" value={module.id} />
              <div className="min-w-[200px] flex-1">
                <p className="font-medium">
                  {module.position}. {module.title}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Calculated {formatAz(maximum.calculated)} · Effective{" "}
                  {formatAz(maximum.effective)}
                </p>
              </div>
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Override
                <input
                  name="override"
                  type="number"
                  min={0}
                  defaultValue={module.maxAzOverride ?? ""}
                  className="az-input mt-2 w-28"
                />
              </label>
              <label className="flex items-center gap-2 pb-2 text-sm text-[var(--muted)]">
                <input
                  name="useOverride"
                  type="checkbox"
                  defaultChecked={module.useMaxAzOverride}
                />
                Use override
              </label>
              <button type="submit" className="az-btn az-btn-ghost">
                Save
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--line-strong)] pt-8">
        <h3
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Final ranking
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          TOP_1 / TOP_2 / TOP_3 / MANAGER. Не обещает трудоустройство. Отдельно от Bronze / Silver /
          Gold.
        </p>
        <form action={runFinalRankingAction} className="mt-5">
          <input type="hidden" name="adminId" value={adminId} />
          <button type="submit" className="az-btn az-btn-accent">
            Рассчитать итоговый рейтинг
          </button>
        </form>
      </section>
    </AppShell>
  );
}
