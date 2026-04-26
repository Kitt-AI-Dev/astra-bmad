import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  fallback: [
    "Apple Symbols",
    "Segoe UI Symbol",
    "Noto Sans Symbols 2",
    "Symbola",
    "monospace",
  ],
});

export const metadata: Metadata = {
  title: "404tune",
  description: "Your daily horoscope for your sign × IT role",
};

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
        {children}
      </body>
    </html>
  );
}
