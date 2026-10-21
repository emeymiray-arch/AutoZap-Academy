import type { Metadata } from "next";
import { Cinzel, Great_Vibes, Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import { CertificatePreview } from "@/components/certificate/certificate-preview";

export const metadata: Metadata = {
  title: "AutoZap Specialist Certificate",
  description: "Certificate of Specialization — AutoZap Academy design variants",
};

const certDisplay = Cinzel({
  subsets: ["latin"],
  variable: "--font-cert-display",
  weight: ["600", "700"],
});

const certScript = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-cert-script",
  weight: ["400"],
});

const certSerif = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-cert-serif",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const certSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-cert-sans",
  weight: ["400", "600", "700"],
});

export default function CertificatePreviewPage() {
  return (
    <main
      className={`${certDisplay.variable} ${certScript.variable} ${certSerif.variable} ${certSans.variable} min-h-screen bg-[#0b1220] px-3 py-8 md:px-6 md:py-12`}
    >
      <div className="mx-auto mb-6 max-w-[960px] text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#03cdfd]">Design preview</p>
        <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">
          AutoZap Specialist Certificate
        </h1>
        <p className="mt-2 text-sm text-white/65">
          Four drawn frames · line ornaments, not flat graphics
        </p>
      </div>
      <CertificatePreview />
    </main>
  );
}
