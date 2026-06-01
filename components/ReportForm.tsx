'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Loader2, CheckCircle2, CloudOff, AlertTriangle } from 'lucide-react';
import { submitReport, syncPending, type FieldReportInput } from '@/lib/field-report';
import { STREAM_LABELS, type ProgrammeStream } from '@/lib/roles';

interface SiteOption { id: string; name: string }

export interface ReportFormProps {
  supervisorId: string;
  lockedSiteId: string | null;
  lockedSiteName: string | null;
  lockedStream: ProgrammeStream | null;
  // For management roles (exec/ops) who may file for any site/stream:
  sites: SiteOption[];
  canChooseScope: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ReportForm(props: ReportFormProps) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(props.lockedSiteId ?? '');
  const [stream, setStream] = useState<ProgrammeStream | ''>(props.lockedStream ?? '');
  const [f, setF] = useState({
    report_date: today(),
    participants_scheduled: '',
    participants_present: '',
    brief_update: '',
    absentees_count: '',
    absentee_names: '',
    absentee_reasons: '',
    exact_location: '',
    teams_assigned: '',
    task_description: '',
    work_completed: '',
    tools_used: '',
    incident: false,
    incident_detail: '',
    challenges_risks: '',
    support_required: '',
    attendance_concerns: '',
    decisions_required: '',
    additional_comments: '',
  });
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsState, setGpsState] = useState<'idle' | 'locating' | 'ok' | 'error'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | 'synced' | 'queued'>(null);

  const set = (k: keyof typeof f) => (e: any) =>
    setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const captureGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setGpsState('error'); return; }
    setGpsState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsState('ok'); },
      () => setGpsState('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Auto-capture GPS on open and flush any queued reports from earlier.
  useEffect(() => { captureGps(); syncPending().catch(() => {}); }, [captureGps]);

  const num = (v: string) => (v === '' ? null : Number(v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!siteId || !stream) { setError('Site and programme stream are required.'); return; }
    setSubmitting(true);
    const payload: FieldReportInput = {
      site_id: siteId,
      stream: stream as ProgrammeStream,
      supervisor_id: props.supervisorId,
      report_date: f.report_date,
      participants_scheduled: num(f.participants_scheduled),
      participants_present: num(f.participants_present),
      brief_update: f.brief_update,
      absentees_count: num(f.absentees_count),
      absentee_names: f.absentee_names,
      absentee_reasons: f.absentee_reasons,
      exact_location: f.exact_location,
      teams_assigned: f.teams_assigned,
      task_description: f.task_description,
      work_completed: f.work_completed,
      tools_used: f.tools_used,
      incident: f.incident,
      incident_detail: f.incident_detail,
      challenges_risks: f.challenges_risks,
      support_required: f.support_required,
      attendance_concerns: f.attendance_concerns,
      decisions_required: f.decisions_required,
      additional_comments: f.additional_comments,
      gps_lat: gps?.lat ?? null,
      gps_lng: gps?.lng ?? null,
    };
    try {
      const res = await submitReport(payload);
      setDone(res.status);
      setTimeout(() => { router.replace('/dashboard'); router.refresh(); }, 1600);
    } catch (err: any) {
      setError(err?.message || 'Could not submit. Please try again.');
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center shadow-sm ring-1 ring-gray-100">
        {done === 'synced' ? (
          <><CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Report submitted</h2>
            <p className="text-gray-500 text-sm mt-1">Synced to the server. Returning to your dashboard…</p></>
        ) : (
          <><CloudOff className="w-14 h-14 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Saved offline</h2>
            <p className="text-gray-500 text-sm mt-1">No connection right now — your report is safe and will sync automatically when you’re back online.</p></>
        )}
      </div>
    );
  }

  const field = 'w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-yami-blue/20 text-sm';
  const label = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5';
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-3xl p-6 md:p-7 shadow-sm ring-1 ring-gray-100 space-y-4">
      <h3 className="text-sm font-bold text-yami-navy uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto pb-28">
      <Section title="Report Details">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Site / Project</label>
            {props.canChooseScope ? (
              <select className={field} value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
                <option value="">Select site…</option>
                {props.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : <div className="px-4 py-3 rounded-xl bg-yami-bg text-sm font-semibold text-gray-900">{props.lockedSiteName}</div>}
          </div>
          <div>
            <label className={label}>Programme Stream</label>
            {props.canChooseScope ? (
              <select className={field} value={stream} onChange={(e) => setStream(e.target.value as ProgrammeStream)} required>
                <option value="">Select stream…</option>
                {Object.entries(STREAM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : <div className="px-4 py-3 rounded-xl bg-yami-bg text-sm font-semibold text-gray-900">{stream ? STREAM_LABELS[stream as ProgrammeStream] : '—'}</div>}
          </div>
        </div>
        <div>
          <label className={label}>Reporting Period (Date)</label>
          <input type="date" className={field} value={f.report_date} onChange={set('report_date')} required />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-yami-blue" />
          {gpsState === 'locating' && <span className="text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Capturing GPS…</span>}
          {gpsState === 'ok' && gps && <span className="text-emerald-600 font-medium">GPS {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</span>}
          {gpsState === 'error' && <button type="button" onClick={captureGps} className="text-amber-600 font-medium">GPS unavailable — tap to retry</button>}
          {gpsState === 'idle' && <button type="button" onClick={captureGps} className="text-yami-blue font-medium">Capture GPS</button>}
        </div>
      </Section>

      <Section title="Participants">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Total Scheduled</label><input type="number" min="0" className={field} value={f.participants_scheduled} onChange={set('participants_scheduled')} /></div>
          <div><label className={label}>Total Present</label><input type="number" min="0" className={field} value={f.participants_present} onChange={set('participants_present')} /></div>
        </div>
        <div><label className={label}>Number of Absentees</label><input type="number" min="0" className={field} value={f.absentees_count} onChange={set('absentees_count')} /></div>
        <div><label className={label}>Names of Absentees</label><textarea rows={2} className={field} value={f.absentee_names} onChange={set('absentee_names')} /></div>
        <div><label className={label}>Reasons Provided</label><textarea rows={2} className={field} value={f.absentee_reasons} onChange={set('absentee_reasons')} /></div>
      </Section>

      <Section title="Work Done Today">
        <div><label className={label}>Brief Update / Outcome</label><textarea rows={2} className={field} value={f.brief_update} onChange={set('brief_update')} /></div>
        <div><label className={label}>Exact Location Worked Today</label><input className={field} value={f.exact_location} onChange={set('exact_location')} /></div>
        <div><label className={label}>Teams / Participants Assigned</label><textarea rows={2} className={field} value={f.teams_assigned} onChange={set('teams_assigned')} /></div>
        <div><label className={label}>Task Description</label><textarea rows={2} className={field} value={f.task_description} onChange={set('task_description')} /></div>
        <div><label className={label}>Work Completed Today</label><textarea rows={2} className={field} value={f.work_completed} onChange={set('work_completed')} /></div>
        <div><label className={label}>Tools / Equipment Used</label><input className={field} value={f.tools_used} onChange={set('tools_used')} /></div>
      </Section>

      <Section title="Incidents">
        <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
          <input type="checkbox" className="w-5 h-5 rounded accent-yami-blue" checked={f.incident} onChange={set('incident')} />
          Any incidents today?
        </label>
        {f.incident && <div><label className={label}>If yes, briefly describe</label><textarea rows={2} className={field} value={f.incident_detail} onChange={set('incident_detail')} /></div>}
      </Section>

      <Section title="Management & Support">
        <div><label className={label}>Operational Challenges / Risks</label><textarea rows={2} className={field} value={f.challenges_risks} onChange={set('challenges_risks')} /></div>
        <div><label className={label}>Requests / Support Required</label><textarea rows={2} className={field} value={f.support_required} onChange={set('support_required')} /></div>
        <div><label className={label}>Attendance & Performance Concerns</label><textarea rows={2} className={field} value={f.attendance_concerns} onChange={set('attendance_concerns')} /></div>
        <div><label className={label}>Decisions Required from Management</label><textarea rows={2} className={field} value={f.decisions_required} onChange={set('decisions_required')} /></div>
        <div><label className={label}>Additional Comments</label><textarea rows={2} className={field} value={f.additional_comments} onChange={set('additional_comments')} /></div>
      </Section>

      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="text-rose-600 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 lg:left-[260px] bg-white/90 backdrop-blur border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <button type="submit" disabled={submitting}
            className="w-full bg-yami-navy hover:bg-yami-navy-light text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Field Report'}
          </button>
        </div>
      </div>
    </form>
  );
}
