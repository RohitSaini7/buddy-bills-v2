import type { Metadata, Viewport } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@lib/utils";
import { ThemeProvider } from "@components/theme-provider";
import { TooltipProvider } from "@components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://buddybills.app"),
  title: "BuddyBills",
  description: "Share expenses, not stress.",
  openGraph: {
    title: "BuddyBills",
    description: "Share expenses, not stress.",
    url: "https://buddybills.app",
    siteName: "BuddyBills",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BuddyBills - Share expenses, not stress",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuddyBills",
    description: "Share expenses, not stress.",
    images: ["/og-image.png"],
  },
  icons: {
    apple: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", montserrat.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Analytics />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
