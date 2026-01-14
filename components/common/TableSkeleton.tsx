import { Skeleton } from '@/components/ui/Skeleton';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                    <tr>
                    {Array.from({ length: columns }).map((_, i) => (
                        <th key={i} className="px-6 py-4">
                            <Skeleton className="h-4 w-24" />
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i}>
                            {Array.from({ length: columns }).map((_, j) => (
                                <td key={j} className="px-6 py-4">
                                    <Skeleton className="h-4 w-full" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
