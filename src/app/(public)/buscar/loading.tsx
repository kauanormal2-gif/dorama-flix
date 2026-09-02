import { SkeletonGrid } from "@/components/SkeletonRow";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <span className="h-8 w-1 bg-white/10 rounded-full" />
        <div className="h-9 w-32 skeleton rounded" />
      </div>
      <div className="h-14 rounded-full skeleton mb-6" />
      <div className="flex gap-2 overflow-hidden pb-2 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-24 rounded-full skeleton flex-shrink-0" />
        ))}
      </div>
      <SkeletonGrid />
    </div>
  );
}
