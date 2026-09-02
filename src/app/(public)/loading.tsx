import { SkeletonRow } from "@/components/SkeletonRow";

export default function Loading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="w-full h-[85vh] md:h-[92vh] relative overflow-hidden">
        <div className="absolute inset-0 skeleton" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div className="absolute bottom-24 left-6 md:left-12 max-w-2xl">
          <div className="h-3 w-24 rounded skeleton mb-6" />
          <div className="h-14 w-80 rounded-xl skeleton mb-4" />
          <div className="h-14 w-64 rounded-xl skeleton mb-8" />
          <div className="flex gap-3">
            <div className="h-12 w-40 rounded-full skeleton" />
            <div className="h-12 w-32 rounded-full skeleton" />
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="max-w-7xl mx-auto pt-8">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}
