import { SkeletonGrid } from "@/components/SkeletonRow";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-16">
      <div className="flex items-center gap-3 mb-8">
        <span className="h-8 w-1 bg-white/10 rounded-full" />
        <div className="h-9 w-52 skeleton rounded" />
      </div>
      <SkeletonGrid count={8} />
    </div>
  );
}
