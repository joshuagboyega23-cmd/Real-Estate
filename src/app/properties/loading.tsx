import { Skeleton } from "@/components/ui/skeleton";

export default function PropertiesLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <Skeleton className="mb-4 h-6 w-40" />
      <Skeleton className="mb-3 h-10 w-80 max-w-full" />
      <Skeleton className="mb-8 h-5 w-[28rem] max-w-full" />
      <Skeleton className="mb-8 h-28 rounded-2xl" />
      <Skeleton className="mb-5 h-5 w-56" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-border bg-white p-0 shadow-sm">
            <Skeleton className="aspect-[16/10] rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-4 h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
