import type { ReactNode } from "react";

export type MedalTier = "gold" | "silver" | "bronze";

const TIER = {
  gold: {
    label: "Золото",
    places: "1–3",
    className:
      "border-[#c9a227] bg-gradient-to-b from-[#ffe566] to-[#e0b422] text-black shadow-[0_8px_24px_rgba(212,160,23,0.28)]",
  },
  silver: {
    label: "Серебро",
    places: "4–6",
    className:
      "border-[#8b95a5] bg-gradient-to-b from-[#eef1f5] to-[#b0b8c4] text-black shadow-[0_8px_24px_rgba(154,163,178,0.25)]",
  },
  bronze: {
    label: "Бронза",
    places: "7–9",
    className:
      "border-[#8b5a2b] bg-gradient-to-b from-[#d4a574] to-[#a66a35] text-black shadow-[0_8px_24px_rgba(139,90,43,0.28)]",
  },
} as const;

export function medalTierForPlace(place: number): MedalTier | null {
  if (place >= 1 && place <= 3) return "gold";
  if (place >= 4 && place <= 6) return "silver";
  if (place >= 7 && place <= 9) return "bronze";
  return null;
}

/** Shared podium block: 3 slots for gold / silver / bronze. */
export function MedalTierBlock({
  tier,
  children,
}: {
  tier: MedalTier;
  children: ReactNode;
}) {
  const meta = TIER[tier];
  return (
    <section className={`rounded-2xl border p-3 md:p-4 ${meta.className}`}>
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-black uppercase tracking-[0.1em] text-black md:text-lg">
          {meta.label}
        </h3>
        <span className="text-sm font-bold text-black/80 md:text-base">места {meta.places}</span>
      </header>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

export function MedalEmptySlot({ index }: { index: number }) {
  return (
    <li className="rounded-xl border border-dashed border-black/35 bg-white/35 px-3 py-3 text-base font-bold text-black/55 md:text-lg">
      Свободно · {index}
    </li>
  );
}
