'use client';

import { useState } from 'react';
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true); setPassword(''); setConfirm('');
    setTimeout(() => { setDone(false); setOpen(false); }, 2500);
  };

  const field = 'w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-yami-blue/20 text-sm';
  const label = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5';

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-yami-bg flex items-center justify-center"><KeyRound className="w-5 h-5 text-yami-blue" /></div>
          <h2 className="text-lg font-bold text-gray-900">Password</h2>
        </div>
        {!open && <button onClick={() => setOpen(true)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700">Change</button>}
      </div>

      {done && (
        <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5" /> Password updated.
        </div>
      )}

      {open && !done && (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className={label}>New password</label>
            <input type="password" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="new-password"
              className={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div>
            <label className={label}>Confirm new password</label>
            <input type="password" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="new-password"
              className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter" />
          </div>
          {error && <p className="text-rose-600 text-sm font-medium">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-yami-navy hover:bg-yami-navy-light text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save password'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setError(''); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-800">Cancel</button>
          </div>
          <p className="text-[11px] text-gray-400">Tip: passwords are case-sensitive. Avoid a leading capital unless you mean it.</p>
        </form>
      )}
    </div>
  );
}
