"use client";

import { useState } from "react";
import {
  SpecialistCertificate,
  type CertificateVariant,
} from "@/components/certificate/specialist-certificate";
import { cn } from "@/lib/utils";

const VARIANTS: Array<{ id: CertificateVariant; label: string; blurb: string }> = [
  {
    id: "parchment",
    label: "Parchment",
    blurb: "Cream paper, script title, corner filigree, red wax seal.",
  },
  {
    id: "achievement",
    label: "Achievement",
    blurb: "Clean serif title, wax seal on top, grey ornaments.",
  },
  {
    id: "goldline",
    label: "Gold Line",
    blurb: "Gold double frame, serif heading, AutoZap seal.",
  },
  {
    id: "navy",
    label: "Navy",
    blurb: "Dark navy field with gold ornaments.",
  },
];

export function CertificatePreview() {
  const [variant, setVariant] = useState<CertificateVariant>("parchment");
  const current = VARIANTS.find((v) => v.id === variant)!;

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVariant(v.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-bold transition",
              variant === v.id
                ? "border-[#03cdfd] bg-[#03cdfd]/15 text-[#7ae8ff]"
                : "border-white/15 text-white/70 hover:border-white/35 hover:text-white",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      <p className="mb-4 text-center text-sm text-white/55">{current.blurb}</p>
      <SpecialistCertificate variant={variant} />
    </div>
  );
}
