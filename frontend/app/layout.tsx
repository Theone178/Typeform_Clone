import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Typeform Clone",
  description: "Beautiful, conversational forms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen selection:bg-purple-500/20 text-[#262626] bg-[#fbfbfb]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
