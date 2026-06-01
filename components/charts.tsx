'use client';

import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Legend,
} from 'recharts';
import type { TrendPoint, Slice, SiteRollup } from '@/lib/analytics';

const NAVY = '#1B2B4B', BLUE = '#2A7CC7', GREEN = '#10B981', GOLD = '#D4A017', TEAL = '#0D7A6B';
export const STREAM_COLORS: Record<string, string> = { environmental: GREEN, eco_tourism: GOLD, aip: BLUE };
const PIE = [GREEN, GOLD, BLUE, TEAL];

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #eef2f7', boxShadow: '0 8px 30px rgba(0,0,0,.06)', fontSize: 12 },
  labelStyle: { fontWeight: 700, color: NAVY },
};

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="l" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="r" orientation="right" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Bar yAxisId="l" dataKey="reports" name="Reports" fill={BLUE} radius={[6, 6, 0, 0]} maxBarSize={34} />
        <Line yAxisId="r" type="monotone" dataKey="attendance" name="Attendance %" stroke={GREEN} strokeWidth={3} dot={{ r: 3 }} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function StreamDonut({ data }: { data: Slice[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={58} outerRadius={90} paddingAngle={3} stroke="none">
          {data.map((d) => <Cell key={d.key} fill={STREAM_COLORS[d.key] ?? PIE[0]} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SiteBars({ data }: { data: SiteRollup[] }) {
  const d = data.map((s) => ({ name: s.name.replace(/ Dam$| Wetlands$/, ''), reports: s.reports, participants: s.participants }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, d.length * 34)}>
      <BarChart data={d} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="reports" name="Reports" fill={BLUE} radius={[0, 6, 6, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
