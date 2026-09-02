export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[150px] md:w-[190px]">
      <div className="aspect-[2/3] rounded-xl skeleton" />
    </div>
  );
}

export function SkeletonRow({ title = true }: { title?: boolean }) {
  return (
    <section className="mb-12">
      {title && (
        <div className="flex items-center gap-3 mb-5 px-4 md:px-6">
          <span className="h-6 w-1 bg-white/10 rounded-full" />
          <div className="h-6 w-40 rounded-md skeleton" />
        </div>
      )}
      <div className="flex gap-4 px-4 md:px-6 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
