'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { generateBriefing } from '@/app/analytics/actions';

function renderInline(text: string, key: number) {
  // split on **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <span key={key}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="font-bold text-gray-900">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      out.push(<ul key={out.length} className="list-disc pl-5 space-y-1 my-2">{bullets.map((b, i) => <li key={i} className="text-sm text-gray-600 leading-relaxed">{renderInline(b, i)}</li>)}</ul>);
      bullets = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const heading = line.match(/^\*\*(.+?)\*\*:?$/);
    if (heading) { flush(); out.push(<h3 key={out.length} className="text-sm font-bold text-yami-navy uppercase tracking-wide mt-4 first:mt-0">{heading[1]}</h3>); continue; }
    if (/^[-*•]\s+/.test(line)) { bullets.push(line.replace(/^[-*•]\s+/, '')); continue; }
    flush();
    out.push(<p key={out.length} className="text-sm text-gray-600 leading-relaxed my-1.5">{renderInline(line, 0)}</p>);
  }
  flush();
  return <div>{out}</div>;
}

export default function BriefingCard({
  briefing, generatedAt, canRefresh,
}: { briefing: string | null; generatedAt: string | null; canRefresh: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError('');
    const res = await generateBriefing();
    setLoading(false);
    if (res.ok) router.refresh();
    else setError(res.error || 'Could not generate the briefing.');
  };

  return (
    <div className="bg-gradient-to-br from-yami-navy to-yami-navy-light rounded-3xl p-6 md:p-8 shadow-lg shadow-yami-navy/10 text-white">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-yami-blue-light" /></div>
          <div>
            <h2 className="text-lg font-bold">AI Executive Briefing</h2>
            <p className="text-white/50 text-xs font-medium">
              {generatedAt ? `Generated ${new Date(generatedAt).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Synthesised from field reports'}
            </p>
          </div>
        </div>
        {canRefresh && (
          <button onClick={run} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition disabled:opacity-60 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {briefing ? 'Regenerate' : 'Generate'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/15 border border-rose-300/20 rounded-2xl p-4 flex items-start gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0 mt-0.5" />
          <p className="text-rose-100 text-sm">{error}<br /><span className="text-rose-200/70 text-xs">If this mentions the gateway or credits, enable AI Gateway on the Vercel project.</span></p>
        </div>
      )}

      {briefing ? (
        <div className="bg-white rounded-2xl p-5 md:p-6"><Markdown text={briefing} /></div>
      ) : !error ? (
        <div className="bg-white/5 rounded-2xl p-8 text-center">
          <p className="text-white/70 text-sm">{canRefresh ? 'Generate an AI summary of recurring challenges, support needs, absenteeism and anomalies across all reports.' : 'No briefing generated yet.'}</p>
        </div>
      ) : null}
    </div>
  );
}
