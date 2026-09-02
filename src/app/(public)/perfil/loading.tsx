export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <div className="flex items-center gap-3 mb-8">
        <span className="h-8 w-1 bg-white/10 rounded-full" />
        <div className="h-9 w-40 skeleton rounded" />
      </div>
      <div className="h-44 rounded-3xl skeleton mb-6" />
      <div className="h-64 rounded-3xl skeleton mb-6" />
      <div className="h-14 rounded-2xl skeleton" />
    </div>
  );
}
