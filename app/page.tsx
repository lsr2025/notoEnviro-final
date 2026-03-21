'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('employee_id', employeeId.toUpperCase())
          .maybeSingle();

        if (profile) {
          // Store user info in session storage
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark to-navy px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌿💧</div>
          <h1 className="text-4xl font-bold text-teal mb-2">NotoEnviro</h1>
          <p className="text-gray-300 text-sm mb-1">YMS × IDC SEF Programme</p>
          <p className="text-gray-400 text-xs">Workstream B | Msinsi Holdings</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-navy rounded-lg p-6 border border-teal/30">
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Employee ID
            </label>
            <input
              type="text"
              placeholder="e.g. YMS-M-FS-001"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-lg bg-dark border border-teal/50 text-white placeholder-gray-500 focus:border-env-green focus:outline-none focus:ring-2 focus:ring-env-green/20"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-dark border border-teal/50 text-white placeholder-gray-500 focus:border-env-green focus:outline-none focus:ring-2 focus:ring-env-green/20"
              required
              disabled={loading}
            />
            <p className="text-gray-400 text-xs mt-2">
              Default password: your employee ID
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !employeeId || !password}
            className="w-full bg-env-green hover:bg-emerald-600 text-dark font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Offline Status */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-env-green rounded-full"></span>
            Ready to work offline
          </p>
        </div>
      </div>
    </main>
  );
}
