# AutoZap Academy

Корпоративная обучающая платформа. Домен **AZ** — единая система оценки результатов и прогресса.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + SQLite (local). Production target: PostgreSQL
- Domain service: `server/az/az-service.ts`

## Quick start

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open:

- Student dashboard: http://localhost:3000/dashboard
- AZ history: http://localhost:3000/az-history
- Academy: http://localhost:3000/academy
- Admin AZ CMS: http://localhost:3000/admin/az
- Leaderboard: http://localhost:3000/leaderboard

## AZ domain

Backend is the source of truth. Frontend never calculates AZ / level / ranking.

`AZService` methods:

- `calculateReward` / `applyReward` / `recalculateReward`
- `calculateModuleMaximum` / `calculateLevel` / `recalculateLevel`
- `getStudentAZSummary` / `getAZHistory`
- `calculateFinalRanking` / `determineFinalStatus`
- `publishRewardRuleVersion` (`FUTURE_ONLY` | `RECALCULATE_EXISTING`)

Ledger (`AzLedgerEntry`) is append-only. Balance cache on `UserAzBalance`.

## Tests

```bash
npx prisma db push
npm run test:az
```

## Notes

- Auth is stubbed via `DEMO_STUDENT_ID` / `DEMO_ADMIN_ID` until Auth.js is wired.
- No hardcoded AZ amounts in domain logic — seed provides example Admin-configured rules.
- Content placeholders: «Контент будет добавлен командой AutoZap.»
