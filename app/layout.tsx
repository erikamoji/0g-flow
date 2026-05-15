import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono, Fraunces } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "0G Flow — Compose decentralized AI, visually.",
  description:
    "The Decentralized Operating System for AI Agents. Compose · Deploy · Anchor on the 0G modular blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-0 text-fg-1">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
