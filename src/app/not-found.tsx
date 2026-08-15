import Link from "next/link";
import { Button } from "@components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground text-lg">
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved or
          deleted.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
