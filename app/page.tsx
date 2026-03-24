'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Leaf, ShieldCheck, Info } from 'lucide-react';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = `${employeeId.toLowerCase()}@notoenviro.co.za`;

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Invalid employee ID or password');
        setLoading(false);
        return;
      }

      if (data.session) {
        // Store session in cookie (simplified)
        document.cookie = `auth-token=${data.session.access_token}; path=/; max-age=86400`;

        // Fetch user profile - try both 'profiles' and 'users' for compatibility
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.session.user.id)
          .maybeSingle();
        
        if (!profile) {
          const { data: oldProfile } = await supabase
            .from('users')
            .select('*')
            .eq('employee_id', employeeId.toUpperCase())
            .maybeSingle();
          profile = oldProfile;
        }

        if (profile) {
          sessionStorage.setItem('user', JSON.stringify(profile));
        }

        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-yami-bg">
      {/* Left Side: Branding & Info (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-yami-navy p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yami-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl">
              <span className="text-yami-navy font-black text-2xl">NE</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl tracking-tight">NOTOENVIRO</h1>
              <p className="text-white/40 text-xs font-medium tracking-widest uppercase">Solutions</p>
            </div>
          </div>

          <div className="max-w-md space-y-8">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Empowering Environmental <span className="text-yami-blue-light">Restoration</span> through Data.
            </h2>
            <p className="text-white/60 text-lg leading-relaxed">
              YMS × IDC SEF Programme: Streamlining field data collection for sustainable impact in South African ecosystems.
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-yami-blue/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-yami-blue-light" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Secure Access</h4>
                  <p className="text-white/40 text-xs mt-1">Authorized personnel only. Verified employee credentials required.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Offline First</h4>
                  <p className="text-white/40 text-xs mt-1">Log field data anywhere. Automatic synchronization when back online.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs font-medium tracking-wide">
          © 2026 Kwahlelwa Group (Pty) Ltd. All Rights Reserved.
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
             <div className="w-16 h-16 rounded-2xl bg-yami-navy flex items-center justify-center shadow-xl mx-auto mb-4">
              <span className="text-white font-black text-2xl">NE</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">NotoEnviro</h1>
            <p className="text-gray-500 text-sm mt-1">YMS × IDC SEF Programme</p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm ring-1 ring-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your credentials to access your dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. YMS-M-FS-001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-yami-blue/20 transition-all font-medium"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-yami-blue/20 transition-all font-medium"
                  required
                  disabled={loading}
                />
                <div className="mt-3 flex items-start gap-2 px-1">
                  <Info className="w-3.5 h-3.5 text-yami-blue mt-0.5 shrink-0" />
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                    Default password is your Employee ID unless you have changed it.
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-rose-600 text-xs font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !employeeId || !password}
                className="w-full bg-yami-navy hover:bg-yami-navy-light text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-yami-navy/10 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In to Dashboard'}
              </button>
            </form>
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-400 text-xs font-medium flex items-center justify-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Secure Offline-First Environment
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
