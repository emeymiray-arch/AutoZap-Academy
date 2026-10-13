import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type CertificateVariant = "parchment" | "achievement" | "goldline" | "navy";

export type SpecialistCertificateProps = {
  variant?: CertificateVariant;
  recipientName?: string;
  issuedOn?: string;
  programLabel?: string;
  directorName?: string;
  trainerName?: string;
};

const BODY =
  "for successfully completing the AutoZap Academy specialist training program and demonstrating professional mastery of the AutoZap automotive marketplace.";

function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-full bg-[linear-gradient(135deg,#4ee0ff,#03cdfd_45%,#0360fd)] p-[1.5px]"
      style={{ width: size, height: size }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-[#05060c]">
        <Image
          src="/brand/autozap-mark.png"
          alt="AutoZap"
          width={size}
          height={size}
          className="h-[70%] w-[70%] object-contain"
          priority
        />
      </div>
    </div>
  );
}

/** Thin double rule + corner filigree + mid-edge swashes (reference style) */
function Frame({ color = "#2a2a2a" }: { color?: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-[2.8%] h-[94.4%] w-[94.4%]"
      viewBox="0 0 1000 700"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <g id="c-corner" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M6 58 C6 34 8 24 20 18 C34 10 48 16 52 28 C56 40 46 48 36 46 C28 44 26 36 32 32 C40 26 54 30 60 40 C70 56 88 46 82 28 C76 12 56 6 40 12 C22 20 12 36 8 52"
            strokeWidth="1.4"
          />
          <path
            d="M58 8 C72 6 88 12 86 26 C84 38 70 40 64 30 C60 24 68 18 76 20"
            strokeWidth="1.15"
          />
          <path
            d="M8 58 C6 72 12 88 26 86 C38 84 40 70 30 64 C24 60 18 68 20 76"
            strokeWidth="1.15"
          />
          <circle cx="36" cy="34" r="1.5" fill={color} stroke="none" />
        </g>
        <g id="c-mid" fill="none" stroke={color} strokeLinecap="round">
          <path d="M0 8 C14 8 20 2 30 2 C40 2 46 8 56 8 C66 8 72 2 82 2 C92 2 98 8 112 8" strokeWidth="1.2" />
          <path d="M48 8 C52 2 60 2 64 8 M48 8 C52 14 60 14 64 8" strokeWidth="1" />
          <circle cx="56" cy="8" r="1.5" fill={color} stroke="none" />
        </g>
      </defs>

      <rect x="20" y="20" width="960" height="660" fill="none" stroke={color} strokeWidth="1.6" />
      <rect x="26" y="26" width="948" height="648" fill="none" stroke={color} strokeWidth="0.7" opacity="0.55" />

      <g transform="translate(18,18)">
        <use href="#c-corner" />
      </g>
      <g transform="translate(982,18) rotate(90)">
        <use href="#c-corner" />
      </g>
      <g transform="translate(18,682) rotate(-90)">
        <use href="#c-corner" />
      </g>
      <g transform="translate(982,682) rotate(180)">
        <use href="#c-corner" />
      </g>

      <g transform="translate(444,12)">
        <use href="#c-mid" />
      </g>
      <g transform="translate(444,680) scale(1,-1)">
        <use href="#c-mid" />
      </g>
    </svg>
  );
}

function Swash({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={cn("h-2.5 w-12 shrink-0 md:w-16", className)}
      viewBox="0 0 64 10"
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M2 5 C14 5 18 2 28 2 C38 2 42 5 54 5 C58 5 60 4 62 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WaxSeal({ letter = "A" }: { letter?: string }) {
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_28%,#e85d4a,#9e1f18_58%,#6a120e)] text-[#f8e7d8] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18),0_4px_10px_rgba(0,0,0,0.25)] md:h-16 md:w-16">
      <span
        className="text-xl leading-none md:text-2xl"
        style={{ fontFamily: "var(--font-cert-script), cursive" }}
      >
        {letter}
      </span>
    </div>
  );
}

function GoldSeal() {
  return (
    <div className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_28%,#ffe08a,#c9a227_55%,#8a6a12)] text-[#1a1204] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.28),0_4px_10px_rgba(0,0,0,0.2)] md:h-16 md:w-16">
      <Logo size={28} />
    </div>
  );
}

function Sig({
  label,
  name,
  light,
}: {
  label: string;
  name: string;
  light?: boolean;
}) {
  return (
    <div className="min-w-[7rem] flex-1 text-center md:min-w-[9rem]">
      <div className={cn("mx-auto mb-1 h-6 border-b", light ? "border-white/35" : "border-black/30")} />
      <p
        className={cn(
          "text-[0.58rem] font-semibold uppercase tracking-[0.14em]",
          light ? "text-white/80" : "text-black/80",
        )}
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        {name}
      </p>
      <p
        className={cn("text-[0.52rem] uppercase tracking-[0.1em]", light ? "text-white/45" : "text-black/45")}
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        {label}
      </p>
    </div>
  );
}

function Shell({
  children,
  className,
  frameColor,
}: {
  children: ReactNode;
  className?: string;
  frameColor?: string;
}) {
  return (
    <article
      className={cn(
        "az-cert relative mx-auto aspect-[1.414/1] w-full max-w-[820px] overflow-hidden rounded-sm shadow-[0_18px_48px_rgba(10,22,40,0.28)]",
        className,
      )}
      aria-label="AutoZap Specialist Certificate"
    >
      <Frame color={frameColor} />
      <div className="relative flex h-full flex-col items-center px-[7%] py-[5.5%] text-center">
        {children}
      </div>
    </article>
  );
}

function ParchmentCertificate(props: Required<Omit<SpecialistCertificateProps, "variant">>) {
  return (
    <Shell className="bg-[#f4efe4] text-[#1a1a1a]" frameColor="#2c2c2c">
      <Logo size={36} />
      <p
        className="mt-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-[#444]"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        AutoZap Academy
      </p>

      <div className="mt-2.5 flex items-center gap-2">
        <Swash className="text-[#333]" />
        <h1
          className="text-[1.15rem] leading-none md:text-[1.55rem]"
          style={{ fontFamily: "var(--font-cert-script), cursive" }}
        >
          Certificate of Specialization
        </h1>
        <Swash className="text-[#333]" flip />
      </div>

      <p
        className="mt-2 text-[0.68rem] tracking-wide text-[#444] md:text-xs"
        style={{ fontFamily: "var(--font-cert-serif), Georgia, serif", fontStyle: "italic" }}
      >
        This certificate is proudly presented to
      </p>

      <p
        className="mt-1.5 text-[1.65rem] leading-none md:text-[2.1rem]"
        style={{ fontFamily: "var(--font-cert-script), cursive" }}
      >
        {props.recipientName}
      </p>
      <div className="mt-1.5 h-px w-40 bg-[#1a1a1a]/35 md:w-52" />

      <p
        className="mt-2.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] md:text-xs"
        style={{ fontFamily: "var(--font-cert-serif), Georgia, serif" }}
      >
        {props.programLabel}
      </p>
      <p
        className="mt-1.5 max-w-[28rem] text-[0.68rem] leading-snug text-[#555] md:text-[0.78rem]"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        {BODY}
      </p>

      <div className="mt-auto flex w-full items-end justify-between gap-3 pt-3">
        <Sig name={props.directorName} label="Academy Director" />
        <WaxSeal letter="A" />
        <Sig name={props.trainerName} label="Head of Training" />
      </div>
      <p
        className="mt-1 text-[0.55rem] uppercase tracking-[0.14em] text-[#777]"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        Presented on {props.issuedOn}
      </p>
    </Shell>
  );
}

function AchievementCertificate(props: Required<Omit<SpecialistCertificateProps, "variant">>) {
  return (
    <Shell className="bg-[#f7f7f4] text-[#111]" frameColor="#6b7280">
      <WaxSeal letter="A" />
      <h1
        className="mt-2 text-[1.05rem] font-bold uppercase tracking-[0.12em] text-[#0b2a4a] md:text-[1.35rem]"
        style={{ fontFamily: "var(--font-cert-display), Georgia, serif" }}
      >
        Certificate
      </h1>
      <p
        className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#0b2a4a] md:text-sm"
        style={{ fontFamily: "var(--font-cert-display), Georgia, serif" }}
      >
        of Specialization
      </p>
      <p
        className="mt-2 text-[0.62rem] uppercase tracking-[0.16em] text-[#333]"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        This certificate is presented to
      </p>
      <p
        className="mt-1.5 text-[1.7rem] leading-none md:text-[2.15rem]"
        style={{ fontFamily: "var(--font-cert-script), cursive" }}
      >
        {props.recipientName}
      </p>
      <div className="mt-1.5 h-px w-44 bg-black/30 md:w-56" />
      <p
        className="mt-2.5 max-w-[28rem] text-[0.68rem] leading-snug text-[#444] md:text-[0.78rem]"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        {BODY} Awarded by AutoZap Academy · {props.issuedOn}.
      </p>
      <div className="mt-auto flex w-full items-end justify-between gap-6 pt-4">
        <Sig name={props.issuedOn} label="Date" />
        <Sig name={props.directorName} label="Signature" />
      </div>
    </Shell>
  );
}

function GoldlineCertificate(props: Required<Omit<SpecialistCertificateProps, "variant">>) {
  return (
    <Shell className="bg-[#f6f1e6] text-[#151515]" frameColor="#b8962e">
      <Swash className="text-[#b8962e]" />
      <h1
        className="mt-1 text-[1.15rem] font-bold uppercase tracking-[0.14em] md:text-[1.45rem]"
        style={{ fontFamily: "var(--font-cert-display), Georgia, serif" }}
      >
        Certificate
      </h1>
      <p
        className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-[#444] md:text-sm"
        style={{ fontFamily: "var(--font-cert-display), Georgia, serif" }}
      >
        of Specialization
      </p>
      <Swash className="mt-1 text-[#b8962e]" />
      <p
        className="mt-2 text-[0.68rem] text-[#555]"
        style={{ fontFamily: "var(--font-cert-serif), Georgia, serif", fontStyle: "italic" }}
      >
        AutoZap Academy proudly presents this to
      </p>
      <p
        className="mt-1.5 text-[1.7rem] leading-none md:text-[2.15rem]"
        style={{ fontFamily: "var(--font-cert-script), cursive" }}
      >
        {props.recipientName}
      </p>
      <div className="mt-1.5 h-px w-40 bg-[#b8962e]/70 md:w-52" />
      <p
        className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.14em]"
        style={{ fontFamily: "var(--font-cert-serif), Georgia, serif" }}
      >
        {props.programLabel}
      </p>
      <p
        className="mt-1.5 max-w-[28rem] text-[0.68rem] leading-snug text-[#555] md:text-[0.78rem]"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        {BODY}
      </p>
      <div className="mt-auto flex w-full items-end justify-between gap-3 pt-3">
        <Sig name={props.directorName} label="Academy Director" />
        <GoldSeal />
        <Sig name={props.trainerName} label="Head of Training" />
      </div>
      <p
        className="mt-1 text-[0.55rem] uppercase tracking-[0.14em] text-[#777]"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        {props.issuedOn}
      </p>
    </Shell>
  );
}

function NavyCertificate(props: Required<Omit<SpecialistCertificateProps, "variant">>) {
  return (
    <Shell
      className="bg-[radial-gradient(ellipse_at_center,#15325a_0%,#07111f_70%)] text-white"
      frameColor="#c9a227"
    >
      <Logo size={36} />
      <p
        className="mt-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-[#9ad9ff]"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        AutoZap Academy
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Swash className="text-[#c9a227]" />
        <h1
          className="text-[1.1rem] leading-none md:text-[1.45rem]"
          style={{ fontFamily: "var(--font-cert-display), Georgia, serif", fontWeight: 700 }}
        >
          Certificate of Specialization
        </h1>
        <Swash className="text-[#c9a227]" flip />
      </div>
      <p
        className="mt-2 text-[0.68rem] text-white/65"
        style={{ fontFamily: "var(--font-cert-serif), Georgia, serif", fontStyle: "italic" }}
      >
        This certificate is proudly presented to
      </p>
      <p
        className="mt-1.5 text-[1.65rem] leading-none md:text-[2.05rem]"
        style={{ fontFamily: "var(--font-cert-script), cursive" }}
      >
        {props.recipientName}
      </p>
      <div className="mt-1.5 h-px w-40 bg-[#c9a227]/70 md:w-52" />
      <p
        className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#ffe08a]"
        style={{ fontFamily: "var(--font-cert-serif), Georgia, serif" }}
      >
        {props.programLabel}
      </p>
      <p
        className="mt-1.5 max-w-[28rem] text-[0.68rem] leading-snug text-white/60 md:text-[0.78rem]"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        {BODY}
      </p>
      <div className="mt-auto flex w-full items-end justify-between gap-3 pt-3">
        <Sig name={props.directorName} label="Academy Director" light />
        <GoldSeal />
        <Sig name={props.trainerName} label="Head of Training" light />
      </div>
      <p
        className="mt-1 text-[0.55rem] uppercase tracking-[0.14em] text-white/40"
        style={{ fontFamily: "var(--font-cert-sans), sans-serif" }}
      >
        Presented on {props.issuedOn}
      </p>
    </Shell>
  );
}

export function SpecialistCertificate({
  variant = "parchment",
  recipientName = "Alexandra Petrova",
  issuedOn = "October 12, 2026",
  programLabel = "AutoZap Specialist",
  directorName = "Elena Morozova",
  trainerName = "Dmitry Volkov",
}: SpecialistCertificateProps) {
  const shared = { recipientName, issuedOn, programLabel, directorName, trainerName };
  if (variant === "achievement") return <AchievementCertificate {...shared} />;
  if (variant === "goldline") return <GoldlineCertificate {...shared} />;
  if (variant === "navy") return <NavyCertificate {...shared} />;
  return <ParchmentCertificate {...shared} />;
}
