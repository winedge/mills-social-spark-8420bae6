export function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted/40 ${className}`} />;
}

function SectionHeadSkeleton({ align = "left" }: { align?: "left" | "center" }) {
  const center = align === "center";
  return (
    <div className={`mb-10 ${center ? "text-center flex flex-col items-center" : ""}`}>
      <Shimmer className="h-3 w-40 mb-4" />
      <Shimmer className="h-10 w-72 max-w-full mb-3" />
      <Shimmer className="h-3 w-full max-w-md" />
    </div>
  );
}

export function NflSectionSkeleton() {
  return (
    <section className="border-y border-border bg-background py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeadSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <article key={i} className="border border-border bg-[#08090c] overflow-hidden">
              <div className="flex items-stretch">
                <div className="flex-1 flex items-center gap-3 px-3 py-5">
                  <Shimmer className="size-14 rounded-full shrink-0" />
                  <Shimmer className="h-7 w-16" />
                </div>
                <div className="shrink-0 w-16 border-x border-white/10 flex items-center justify-center">
                  <Shimmer className="h-5 w-8" />
                </div>
                <div className="flex-1 flex flex-row-reverse items-center gap-3 px-3 py-5">
                  <Shimmer className="size-14 rounded-full shrink-0" />
                  <Shimmer className="h-7 w-16" />
                </div>
              </div>
              <div className="border-t border-white/10 bg-black/60 px-3 py-3 flex justify-center">
                <Shimmer className="h-3 w-40" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UfcSectionSkeleton() {
  return (
    <section className="py-24 px-6 border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto">
        <SectionHeadSkeleton />
        <Shimmer className="h-24 w-full mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <article key={i} className="bg-background border border-border p-6 flex flex-col gap-4">
              <div className="flex justify-between gap-2">
                <Shimmer className="h-5 w-40" />
                <Shimmer className="h-3 w-16" />
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 my-2">
                <Shimmer className="h-6 w-full" />
                <Shimmer className="h-5 w-6" />
                <Shimmer className="h-6 w-full" />
              </div>
              <div className="border-t border-border pt-3 flex flex-col gap-2">
                <Shimmer className="h-3 w-24" />
                <Shimmer className="h-3 w-full" />
                <Shimmer className="h-3 w-5/6" />
                <Shimmer className="h-3 w-2/3" />
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <Shimmer className="h-3 w-28" />
                <Shimmer className="h-3 w-16" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DailySpecialsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <Shimmer className="aspect-[4/5] w-full mb-6" />
          <div className="flex justify-between gap-4">
            <div className="flex-1">
              <Shimmer className="h-6 w-2/3 mb-2" />
              <Shimmer className="h-3 w-full" />
            </div>
            <Shimmer className="h-4 w-14 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WeeklyPulseSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-background">
          <Shimmer className="aspect-[4/3] w-full" />
          <div className="p-6">
            <Shimmer className="h-6 w-1/2 mb-3" />
            <Shimmer className="h-3 w-full mb-2" />
            <Shimmer className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
