import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Your Personal Trainer",
  description: "Your personal trainer, adapted to you.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F7F5" },
    { media: "(prefers-color-scheme: dark)", color: "#101114" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
