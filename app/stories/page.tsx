import { BookOpen, MapPin, User } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { CAN_CREATE_REPORTS } from '@/lib/roles';
import { requireProfile } from '@/lib/auth';
import StoryForm from '@/components/StoryForm';

const TYPE_TONE: Record<string, string> = {
  Impact: 'bg-emerald-50 text-emerald-700',
  Environment: 'bg-teal-50 text-teal-700',
  Community: 'bg-blue-50 text-blue-700',
  'Skills & Growth': 'bg-amber-50 text-amber-700',
  Challenge: 'bg-rose-50 text-rose-700',
};

export default async function StoriesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: stories }, { data: sites }] = await Promise.all([
    supabase.from('stories').select('id, title, type, storyteller, site_name, tags, content, photo_url, created_at').order('created_at', { ascending: false }),
    supabase.from('sites').select('id, name').order('name'),
  ]);
  const canCreate = CAN_CREATE_REPORTS.includes(profile.role);

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1100px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stories from the field</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">The human layer behind the numbers — voices, impact and moments from the dams.</p>
        </div>
        {canCreate && <StoryForm sites={sites ?? []} />}
      </div>

      {stories && stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {stories.map((s: any) => (
            <article key={s.id} className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-gray-100 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                {s.type && <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${TYPE_TONE[s.type] ?? 'bg-gray-100 text-gray-600'}`}>{s.type}</span>}
                {s.created_at && <span className="text-[11px] text-gray-400 font-medium">{new Date(s.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{s.title}</h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed flex-1">{s.content}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500">
                {s.storyteller && <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> {s.storyteller}</span>}
                {s.site_name && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {s.site_name}</span>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm ring-1 ring-gray-100">
          <div className="w-16 h-16 bg-yami-bg rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="w-8 h-8 text-yami-blue" /></div>
          <h3 className="text-gray-900 font-bold">No stories yet</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">{canCreate ? 'Be the first to capture a moment from the field.' : 'Stories shared by the team will appear here.'}</p>
        </div>
      )}
    </div>
  );
}
