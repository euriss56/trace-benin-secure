import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton d'une carte statistique (StatCard). */
export function StatCardSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton générique pour tableau. */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: { rows?: number; columns?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/70">
      <div className="border-b border-border/60 bg-muted/40 px-4 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton key={c} className="h-4 w-full max-w-[120px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Bloc skeleton générique : titre + corps. */
export function CardBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
