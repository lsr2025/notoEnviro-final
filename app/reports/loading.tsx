import { BlockSkeleton } from '@/components/PageSkeleton';
export default function Loading() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
      </div>
      <BlockSkeleton height="h-20" />
      <BlockSkeleton height="h-[520px]" />
    </div>
  );
}
