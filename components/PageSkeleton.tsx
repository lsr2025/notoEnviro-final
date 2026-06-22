// Reusable loading skeletons for route-level Suspense fallbacks (loading.tsx).

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-7 w-16 bg-gray-100 rounded mt-3 animate-pulse" />
          <div className="h-2 w-24 bg-gray-100 rounded mt-3 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function BlockSkeleton({ height = 'h-72' }: { height?: string }) {
  return <div className={`bg-white rounded-3xl shadow-sm ring-1 ring-gray-100 ${height} animate-pulse`} />;
}

export default function PageSkeleton({ kpis = 4 }: { kpis?: number }) {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
      </div>
      <KpiSkeleton count={kpis} />
      <BlockSkeleton height="h-80" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlockSkeleton />
        <BlockSkeleton />
      </div>
    </div>
  );
}
