'use client';

interface AttendanceCardProps {
  attendance: number; // percentage 0-100
  presentCount?: number;
  totalCount?: number;
  siteLabel?: string;
}

export const AttendanceCard = ({
  attendance,
  presentCount,
  totalCount,
  siteLabel,
}: AttendanceCardProps) => {
  const getColor = (rate: number) => {
    if (rate >= 90) return 'bg-env-green';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (rate: number) => {
    if (rate >= 90) return 'text-env-green';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-navy rounded-lg p-4 mb-4">
      {siteLabel && <p className="text-gray-300 text-sm mb-2">{siteLabel}</p>}
      <div className="flex items-center justify-between mb-2">
        <p className="text-white font-semibold">Today's Attendance</p>
        <p className={`text-2xl font-bold ${getTextColor(attendance)}`}>
          {attendance}%
        </p>
      </div>
      {presentCount !== undefined && totalCount !== undefined && (
        <p className="text-gray-400 text-sm mb-3">
          {presentCount}/{totalCount} workers present
        </p>
      )}
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getColor(attendance)} transition-all`}
          style={{ width: `${attendance}%` }}
        ></div>
      </div>
    </div>
  );
};
