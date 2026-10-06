import { formatAz } from "@/lib/utils";

/** Compact student speed / level stats — mobile tiles, laptop strip */
export function AzSpeedStats({
  balance,
  maxAvailableAz,
  levelName,
  progressPercent,
}: {
  balance: number;
  maxAvailableAz: number;
  levelName: string;
  progressPercent: number;
}) {
  const tiles = [
    { label: "Скорость", value: formatAz(balance), mono: true },
    { label: "Макс. скорость", value: formatAz(maxAvailableAz), mono: true },
    { label: "Уровень", value: levelName || "—", mono: false },
    { label: "Прогресс", value: `${progressPercent}%`, mono: true },
  ];

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 md:mb-5 md:flex md:max-w-4xl md:gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="az-glass az-tile flex aspect-square flex-col items-center justify-center gap-1 p-2 text-center md:aspect-auto md:min-w-0 md:flex-1 md:flex-row md:justify-between md:gap-3 md:px-4 md:py-3"
        >
          <p className="text-[0.55rem] font-bold uppercase tracking-wider text-[var(--muted)] md:text-xs">
            {tile.label}
          </p>
          <p
            className={`text-base font-extrabold text-[var(--text)] md:text-xl ${tile.mono ? "tabular-nums" : ""}`}
          >
            {tile.value}
          </p>
        </div>
      ))}
    </div>
  );
}
