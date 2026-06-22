'use client';

import { useRef, useState } from 'react';
import { Sparkles, Send, Loader2, Users, Activity, Percent, MessageSquare, FileBarChart } from 'lucide-react';
import { askAssistant, type ChatMessage } from '@/app/ai/actions';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zu', label: 'isiZulu' },
  { code: 'xh', label: 'isiXhosa' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'st', label: 'Sesotho' },
  { code: 'tn', label: 'Setswana' },
];

const QUICK = [
  { type: 'participant_summary', label: 'Participant Summary', icon: Users },
  { type: 'activity_report', label: 'Activity Report', icon: Activity },
  { type: 'attendance_overview', label: 'Attendance Overview', icon: Percent },
  { type: 'feedback_insights', label: 'Feedback Insights', icon: MessageSquare },
  { type: 'full_mini_report', label: 'Full Mini Report', icon: FileBarChart },
];

// Minimal markdown → HTML (bold, headers, bullets) for the assistant bubbles.
function renderMarkdown(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc(md)
    .replace(/^### (.*)$/gm, '<h4 class="font-bold text-gray-900 mt-3 mb-1">$1</h4>')
    .replace(/^## (.*)$/gm, '<h3 class="font-bold text-gray-900 mt-3 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-*] (.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(content: string, quickType?: string) {
    if ((!content.trim() && !quickType) || loading) return;
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const res = await askAssistant({ messages: history, language, quickType });
      if (res.ok && res.text) {
        setMessages((m) => [...m, { role: 'assistant', content: res.text! }]);
      } else {
        setError(res.error || 'Something went wrong.');
      }
    } catch (e: any) {
      setError(e?.message || 'Request failed.');
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    }
  }

  const quick = (type: string, label: string) => send(`${label}`, type);

  return (
    <div className="bg-white rounded-3xl shadow-sm ring-1 ring-gray-100 flex flex-col h-[calc(100vh-220px)] min-h-[480px]">
      {/* Header: language selector */}
      <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-yami-blue/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-yami-blue" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Programme Assistant</p>
            <p className="text-[11px] text-gray-400">Answers from live programme data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 hidden sm:inline">Respond in</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-yami-blue/30"
          >
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 md:px-6 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-yami-blue/10 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-yami-blue" />
            </div>
            <h3 className="font-bold text-gray-900">Ask about the programme</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Ask in your language, or tap a quick report below. Answers use live field-report data within your access.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user' ? 'bg-yami-blue text-white' : 'bg-gray-50 text-gray-800 ring-1 ring-gray-100'
              }`}
            >
              {m.role === 'user' ? (
                m.content
              ) : (
                <div className="prose-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 ring-1 ring-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {/* Quick reports */}
      <div className="px-5 md:px-6 pt-3 flex flex-wrap gap-2 border-t border-gray-100">
        {QUICK.map((q) => (
          <button
            key={q.type}
            onClick={() => quick(q.type, q.label)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <q.icon className="w-3.5 h-3.5" />
            {q.label}
          </button>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="px-5 md:px-6 py-4 flex items-center gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the programme…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yami-blue/30"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center justify-center w-11 h-11 bg-yami-blue hover:bg-yami-blue/90 text-white rounded-xl transition-colors disabled:opacity-40"
          aria-label="Send"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
