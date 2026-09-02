import { SkeletonRow } from "@/components/SkeletonRow";

export default function Loading() {
  return (
    <div>
      {/* Hero */}
      <div className="relative min-h-[80vh] md:min-h-[85vh] overflow-hidden">
        <div className="absolute inset-0 skeleton" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/70 to-dark/20" />
        <div className="absolute bottom-16 left-6 right-6 max-w-5xl">
          <div className="flex gap-8 items-end">
            <div className="hidden md:block w-52 lg:w-60 aspect-[2/3] rounded-xl skeleton" />
            <div className="flex-1">
              <div className="h-4 w-24 rounded skeleton mb-4" />
              <div className="h-12 md:h-16 w-3/4 rounded-xl skeleton mb-3" />
              <div className="h-12 md:h-16 w-1/2 rounded-xl skeleton mb-6" />
              <div className="flex gap-4 mb-6">
                <div className="h-4 w-16 rounded skeleton" />
                <div className="h-4 w-16 rounded skeleton" />
              </div>
              <div className="h-3 w-full max-w-2xl rounded skeleton mb-2" />
              <div className="h-3 w-2/3 rounded skeleton mb-8" />
              <div className="flex gap-3">
                <div className="h-12 w-40 rounded-full skeleton" />
                <div className="h-12 w-32 rounded-full skeleton" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12">
        <SkeletonRow />
      </div>
    </div>
  );
}
