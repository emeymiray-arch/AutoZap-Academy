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
      title="Admin · AZ CMS"
      subtitle="Настройка reward rules, quality ranges, levels, module maximum, tie-break и финальных статусов. Ручное изменение баланса ученика запрещено."
    >
      <div className="space-y-10">
        <section>
          <h3 className="mb-4 text-lg font-medium">Ученики</h3>
          <div className="overflow-hidden rounded-2xl border border-[var(--az-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--az-surface)] text-[var(--az-muted)]">
                <tr>
                  <th className="px-4 py-3">Ученик</th>
                  <th className="px-4 py-3">AZ</th>
                  <th className="px-4 py-3">Max available</th>
                  <th className="px-4 py-3">Level</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.userId} className="border-t border-[var(--az-border)]">
                    <td className="px-4 py-3">{s.user.name}</td>
                    <td className="px-4 py-3 tabular-nums">{formatAz(s.balance)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatAz(s.maxAvailableAz)}</td>
                    <td className="px-4 py-3">{s.level?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Reward rules</h3>
          <div className="space-y-4">
            {rules.map((rule) => {
              const version = rule.versions[0];
              return (
                <article
                  key={rule.id}
                  className="rounded-2xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="mt-1 text-xs text-[var(--az-muted)]">
                        {rule.actionType} · {rule.scopeType} · v{rule.currentVersion} ·{" "}
                        {rule.active ? "active" : "inactive"}
                      </p>
                      <p className="mt-2 text-sm">
                        Max: <strong>{version?.maxAz ?? "—"} AZ</strong>
                        {" · "}
                        partial: {version?.allowsPartial ? "yes" : "no"}
                        {" · "}
                        repeat: {version?.allowsRepeat ? "yes" : "no"}
                        {" · "}
                        quality: {version?.qualityDependent ? "yes" : "no"}
                      </p>
                      {version?.ranges?.length ? (
                        <ul className="mt-2 text-xs text-[var(--az-muted)]">
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
                    <form action={publishAzRuleVersionAction} className="mt-4 grid gap-3 border-t border-[var(--az-border)] pt-4 md:grid-cols-4">
                      <input type="hidden" name="ruleId" value={rule.id} />
                      <input type="hidden" name="adminId" value={adminId} />
                      <input type="hidden" name="qualityDependent" value={String(version.qualityDependent)} />
                      <label className="text-xs text-[var(--az-muted)]">
                        New max AZ
                        <input
                          name="maxAz"
                          type="number"
                          min={0}
                          defaultValue={version.maxAz}
                          className="mt-1 w-full rounded-lg border border-[var(--az-border)] bg-[var(--az-surface)] px-3 py-2 text-sm text-[var(--az-text)]"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs text-[var(--az-muted)]">
                        <input name="allowsPartial" type="checkbox" defaultChecked={version.allowsPartial} />
                        Partial
                      </label>
                      <label className="flex items-center gap-2 text-xs text-[var(--az-muted)]">
                        <input name="allowsRepeat" type="checkbox" defaultChecked={version.allowsRepeat} />
                        Repeat
                      </label>
                      <label className="text-xs text-[var(--az-muted)]">
                        Apply mode
                        <select
                          name="applyMode"
                          defaultValue="FUTURE_ONLY"
                          className="mt-1 w-full rounded-lg border border-[var(--az-border)] bg-[var(--az-surface)] px-3 py-2 text-sm text-[var(--az-text)]"
                        >
                          <option value="FUTURE_ONLY">Только будущие действия</option>
                          <option value="RECALCULATE_EXISTING">Пересчитать выполненные</option>
                        </select>
                      </label>
                      <label className="md:col-span-3 text-xs text-[var(--az-muted)]">
                        Note
                        <input
                          name="note"
                          placeholder="Причина новой версии"
                          className="mt-1 w-full rounded-lg border border-[var(--az-border)] bg-[var(--az-surface)] px-3 py-2 text-sm text-[var(--az-text)]"
                        />
                      </label>
                      <button
                        type="submit"
                        className="rounded-lg bg-[var(--az-accent-dim)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                      >
                        Publish version
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-medium">Level rules</h3>
            <ul className="space-y-2 rounded-2xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-4 text-sm">
              {levels.map((level) => (
                <li key={level.id} className="flex justify-between gap-3">
                  <span>
                    {level.name} <span className="text-[var(--az-muted)]">({level.slug})</span>
                  </span>
                  <span className="tabular-nums text-[var(--az-muted)]">
                    {level.minAz}
                    {level.maxAz != null ? `–${level.maxAz - 1}` : "+"} AZ
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-medium">Tie-break rules</h3>
            <ul className="space-y-2 rounded-2xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-4 text-sm">
              {tieBreaks.map((rule) => (
                <li key={rule.id} className="flex justify-between gap-3">
                  <span>
                    #{rule.priority} {rule.criterion}
                  </span>
                  <span className="text-[var(--az-muted)]">
                    {rule.descending ? "desc" : "asc"} · {rule.active ? "active" : "off"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-medium">Module maximum AZ</h3>
          <div className="space-y-3">
            {moduleMaximums.slice(0, 3).map(({ module, maximum }) => (
              <form
                key={module.id}
                action={setModuleMaxOverrideAction}
                className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-4"
              >
                <input type="hidden" name="adminId" value={adminId} />
                <input type="hidden" name="moduleId" value={module.id} />
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-medium">
                    {module.position}. {module.title}
                  </p>
                  <p className="text-xs text-[var(--az-muted)]">
                    Calculated: {formatAz(maximum.calculated)} · Effective:{" "}
                    {formatAz(maximum.effective)}
                  </p>
                </div>
                <label className="text-xs text-[var(--az-muted)]">
                  Override
                  <input
                    name="override"
                    type="number"
                    min={0}
                    defaultValue={module.maxAzOverride ?? ""}
                    className="mt-1 block w-28 rounded-lg border border-[var(--az-border)] bg-[var(--az-surface)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 pb-2 text-xs text-[var(--az-muted)]">
                  <input name="useOverride" type="checkbox" defaultChecked={module.useMaxAzOverride} />
                  Use override
                </label>
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--az-border)] px-3 py-2 text-xs hover:bg-[var(--az-surface)]"
                >
                  Save
                </button>
              </form>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-5">
          <h3 className="text-lg font-medium">Final ranking / statuses</h3>
          <p className="mt-2 text-sm text-[var(--az-muted)]">
            TOP_1 / TOP_2 / TOP_3 / MANAGER. Не гарантирует трудоустройство. Статусы отдельно от
            Bronze/Silver/Gold.
          </p>
          <form action={runFinalRankingAction} className="mt-4">
            <input type="hidden" name="adminId" value={adminId} />
            <button
              type="submit"
              className="rounded-lg bg-[var(--az-accent)] px-4 py-2 text-sm font-semibold text-[#042f2e]"
            >
              Рассчитать итоговый рейтинг
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
