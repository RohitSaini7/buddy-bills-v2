export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans animate-pulse">
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="flex flex-col items-start gap-6 text-left max-w-xl">
          <div className="w-48 h-6 bg-muted rounded-full"></div>

          <div className="space-y-4 w-full">
            <div className="w-full h-12 md:h-14 bg-muted rounded-lg"></div>
            <div className="w-3/4 h-12 md:h-14 bg-muted rounded-lg"></div>
          </div>

          <div className="space-y-2 w-full mt-2">
            <div className="w-full h-5 bg-muted rounded"></div>
            <div className="w-full h-5 bg-muted rounded"></div>
            <div className="w-2/3 h-5 bg-muted rounded"></div>
          </div>

          <div className="w-40 h-14 bg-muted rounded-full mt-4"></div>
        </div>

        <div className="w-full h-64 md:h-96 bg-muted rounded-2xl"></div>
      </main>
    </div>
  );
}
