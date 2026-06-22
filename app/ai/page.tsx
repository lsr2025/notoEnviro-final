import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import AIAssistant from '@/components/AIAssistant';

// Multilingual programme assistant. Data context is RLS-scoped server-side.
export default async function AIPage() {
  const profile = await requireProfile();
  if (profile.role === 'eco_worker') redirect('/dashboard');

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yami-blue" />
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI Assistant</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1 font-medium">Ask about the programme in your language</p>
      </div>

      <AIAssistant />
    </div>
  );
}
