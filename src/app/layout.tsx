import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Unbounded } from "next/font/google";
import { AuroraScene } from "@/components/layout/aurora-scene";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  // Next injects the real family here; Tailwind theme maps --font-display → this token
  variable: "--font-unbounded",
  weight: ["500", "600", "700", "800"],
});

const body = Source_Sans_3({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const PAPER = "#f4f7fb";

export const metadata: Metadata = {
  title: "AutoZap Academy",
  description: "Корпоративная обучающая платформа AutoZap",
  applicationName: "AutoZap Academy",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon.png", sizes: "128x128", type: "image/png" },
      { url: "/brand/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "AutoZap Academy",
    statusBarStyle: "default",
    startupImage: [
      {
        url: "/brand/pwa/splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/brand/pwa/splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/brand/pwa/splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/brand/pwa/splash-1125x2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/brand/pwa/splash-1242x2688.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/brand/pwa/splash-828x1792.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/brand/pwa/splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/brand/pwa/splash-640x1136.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  // iOS still relies on the legacy tag for splash + home-screen app mode.
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: PAPER,
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${display.variable} ${body.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
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
