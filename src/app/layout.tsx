import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { AuroraScene } from "@/components/layout/aurora-scene";
import { themeBootScript } from "@/components/layout/theme-toggle";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const body = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AutoZap Academy",
  description: "Корпоративная обучающая платформа AutoZap",
  icons: {
    icon: "/brand/favicon.png",
    apple: "/brand/autozap-mark.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="antialiased">
        <AuroraScene />
        <div className="az-app">{children}</div>
      </body>
    </html>
  );
}
