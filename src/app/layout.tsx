import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Source_Sans_3, Unbounded } from "next/font/google";
import { AuroraScene } from "@/components/layout/aurora-scene";
import { THEME_COOKIE, themeBootScript } from "@/lib/theme";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const body = Source_Sans_3({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const cookieTheme = jar.get(THEME_COOKIE)?.value;
  const theme = cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : "dark";

  return (
    <html
      lang="ru"
      className={`${display.variable} ${body.variable}`}
      data-theme={theme}
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
