import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { ThemeInitScript } from "@/components/providers/theme-init-script";
import {
  BRAND_DISCLAIMER,
  BRAND_FULL_NAME,
  BRAND_TAGLINE,
} from "@/lib/constants/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND_FULL_NAME} | Financial Analytics Dashboard`,
    template: `%s | ${BRAND_FULL_NAME}`,
  },
  description: `${BRAND_TAGLINE} ${BRAND_DISCLAIMER}`,
  applicationName: BRAND_FULL_NAME,
  openGraph: {
    title: BRAND_FULL_NAME,
    description: BRAND_TAGLINE,
    siteName: BRAND_FULL_NAME,
    type: "website",
    locale: "en_PH",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_FULL_NAME,
    description: BRAND_TAGLINE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen w-full bg-background text-foreground antialiased">
        <ThemeInitScript />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
