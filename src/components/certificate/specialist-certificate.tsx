import type { ReactNode } from "react";
import Image from "next/image";
import { CertificateFrame, type FrameKind } from "@/components/certificate/certificate-frames";
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
  frame,
  pad = "px-[9%] pb-[8%] pt-[7%]",
}: {
  children: ReactNode;
  className?: string;
  frameColor: string;
  frame: FrameKind;
  pad?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[880px] [container-type:inline-size]">
      <div className="relative h-[calc(100cqi*1000/1414)]">
        <article
          className={cn(
            "az-cert absolute top-0 left-0 h-[calc(880px*1000/1414)] w-[880px] origin-top-left overflow-hidden rounded-sm shadow-[0_18px_48px_rgba(10,22,40,0.28)] [transform:scale(calc(100cqi/880px))]",
            className,
          )}
          aria-label="AutoZap Specialist Certificate"
        >
          <CertificateFrame kind={frame} color={frameColor} />
          <div className={cn("relative flex h-full flex-col items-center text-center", pad)}>{children}</div>
        </article>
      </div>
    </div>
  );
}

function ParchmentCertificate(props: Required<Omit<SpecialistCertificateProps, "variant">>) {
  return (
    <Shell
      className="bg-[#f4efe4] text-[#1a1a1a]"
      frameColor="#2a241c"
      frame="scroll"
      pad="px-[12%] pb-[12%] pt-[13%]"
    >
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
    <Shell className="bg-[#f7f6f2] text-[#111]" frameColor="#3e4650" frame="filigree" pad="px-[11%] pb-[10%] pt-[12%]">
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
    <Shell
      className="bg-[#f7f1e4] text-[#151515]"
      frameColor="#7a5c22"
      frame="lace"
      pad="px-[13%] pb-[13%] pt-[12%]"
    >
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
      className="bg-[radial-gradient(ellipse_at_center,#16345c_0%,#07111f_72%)] text-white"
      frameColor="#e4c56a"
      frame="geometric"
      pad="px-[11%] pb-[10%] pt-[8.5%]"
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
