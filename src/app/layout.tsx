import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // What a shared link shows. The image comes from app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  // Proves ownership to Google Search Console. Public by design; not a secret.
  verification: { google: "RpWpX8UK-b9ZaZ-oPsiFkhV_fRSYTYBBxl9Efwq7FoU" },
  // Opens full screen when added to an iPhone home screen.
  appleWebApp: { capable: true, title: "Trainer", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // One colour, because the app is light whatever the phone is set to.
  themeColor: "#f6f3ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-ink">
        <AuthProvider>{children}</AuthProvider>
        <SiteAnalytics />
      </body>
    </html>
  );
}
