"use client";

import { useEffect } from "react";
import { Button } from "@components/ui/button";
import { AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Group page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <div className="bg-destructive/10 text-destructive p-4 rounded-full mb-6">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        We encountered an error while loading this group. Please try again or return to the
        dashboard.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => reset()} className="gap-2 font-semibold">
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
