'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const TYPES = ['Impact', 'Environment', 'Community', 'Skills & Growth', 'Challenge'];

export default function StoryForm({ sites }: { sites: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ title: '', content: '', type: 'Impact', storyteller: '', site_name: '', tags: '' });
  const set = (k: keyof typeof f) => (e: any) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!f.title.trim() || !f.content.trim()) { setError('A title and the story are required.'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('stories').insert({
      title: f.title.trim(), content: f.content.trim(), type: f.type,
      storyteller: f.storyteller.trim() || null, site_name: f.site_name || null,
      tags: f.tags.trim() || null, include_in_report: true,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setOpen(false); setF({ title: '', content: '', type: 'Impact', storyteller: '', site_name: '', tags: '' });
    setSaving(false); router.refresh();
  };

  const field = 'w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-yami-blue/20 text-sm';
  const label = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5';

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-yami-blue hover:bg-yami-blue/90 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-yami-blue/20">
        <Plus className="w-4 h-4" /> Share a story
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !saving && setOpen(false)}>
      <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Share a story</h2>
          <button onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className={label}>Title</label><input className={field} value={f.title} onChange={set('title')} placeholder="A short headline" /></div>
          <div><label className={label}>The story</label><textarea rows={5} className={field} value={f.content} onChange={set('content')} placeholder="What happened, in the words of the field…" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={label}>Type</label><select className={field} value={f.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className={label}>Site</label><select className={field} value={f.site_name} onChange={set('site_name')}><option value="">—</option>{sites.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={label}>Storyteller</label><input className={field} value={f.storyteller} onChange={set('storyteller')} placeholder="Whose voice is this?" /></div>
            <div><label className={label}>Tags</label><input className={field} value={f.tags} onChange={set('tags')} placeholder="comma, separated" /></div>
          </div>
          {error && <p className="text-rose-600 text-sm font-medium">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-yami-navy hover:bg-yami-navy-light text-white font-bold py-3.5 rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Publish story'}
          </button>
        </form>
      </div>
    </div>
  );
}
