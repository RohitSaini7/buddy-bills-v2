import React from "react";
import { Coins } from "lucide-react";
import { SignInButton, HeaderSignInButton } from "./sign-in-button";
import { SplitDemo } from "./split-demo";

/**
 * Issue #8: Landing page converted to server component for SEO and faster initial render.
 * Only the interactive demo and sign-in buttons are client components.
 */
export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "BuddyBills",
    url: "https://buddybills.app",
    description:
      "Share group expenses, calculate uneven splits automatically, and settle up in seconds.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation Header */}
      <header className="w-full border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Coins className="w-4 h-4" />
            </div>
            <span>BuddyBills</span>
          </div>
          <HeaderSignInButton />
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="flex flex-col items-start gap-6 text-left max-w-xl">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Coins className="w-4 h-4" />
            </div>
            <span>BuddyBills</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Settle bills.
            <br />
            Keep friends.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Stop arguing over splits or doing complex napkin math. Share group expenses, calculate
            uneven splits automatically, and settle up in seconds.
          </p>

          <SignInButton />
        </div>

        <div className="w-full flex items-center justify-center">
          <SplitDemo />
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-12 ">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} BuddyBills. Built for clean expense splitting.
        </div>
      </footer>
    </div>
  );
}
