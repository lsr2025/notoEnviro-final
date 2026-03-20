'use client';

import Link from 'next/link';
import { DamSite } from '@/lib/types';

interface DamSiteCardProps {
  site: DamSite;
  attendance?: number;
  presentCount?: number;
}

export const DamSiteCard = ({ site, attendance = 0, presentCount = 0 }: DamSiteCardProps) => {
  const getColor = (rate: number) => {
    if (rate >= 90) return 'border-env-green';
    if (rate >= 70) return 'border-yellow-500';
    return 'border-red-500';
  };

  return (
    <Link href={`/site/${site.id}`}>
      <div className={`bg-navy rounded-lg p-4 border-l-4 ${getColor(attendance)} hover:shadow-lg transition-shadow cursor-pointer`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-white font-bold text-lg">{site.name}</h3>
          {!site.has_supervisor && (
            <span className="bg-yellow-500 text-dark text-xs font-bold px-2 py-1 rounded">
              ⚠ No Supervisor
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-2">
          👥 {site.worker_count} eco-workers
        </p>
        <div className="bg-dark rounded p-2 mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-300 text-xs">Attendance Rate</span>
            <span className="text-env-green font-bold text-sm">{attendance}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${
                attendance >= 90
                  ? 'bg-env-green'
                  : attendance >= 70
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${attendance}%` }}
            ></div>
          </div>
        </div>
        <p className="text-gray-400 text-xs">
          {presentCount}/{site.worker_count} present today
        </p>
      </div>
    </Link>
  );
};
