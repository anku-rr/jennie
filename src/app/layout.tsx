import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/contexts/SessionContext";
import { EmotionContextProvider } from "@/contexts/EmotionContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jennie - Your Personal AI Therapist",
  description: "Connect with Jennie, your dedicated AI therapy companion. Available 24/7 to listen, support, and guide you through your mental wellness journey.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <EmotionContextProvider>
            {children}
          </EmotionContextProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
