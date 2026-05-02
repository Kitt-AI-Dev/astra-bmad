import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/CookieBanner";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: "404tune",
  description: "Your daily horoscope for your sign × IT role",
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '404tune',
  url: 'https://404tune.dev',
  description: 'Daily horoscope for your zodiac sign and IT role',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="relative min-h-full flex flex-col">
        <a
          href="#reading"
          className="absolute left-0 top-0 -translate-y-full focus:translate-y-0 focus:z-50 bg-surface text-accent-violet border border-accent-violet font-mono text-[13px] px-4 py-2"
        >
          Skip to reading
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
