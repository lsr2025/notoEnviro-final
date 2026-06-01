'use client';

import { createBrowserClient } from '@supabase/ssr';

// Browser client backed by @supabase/ssr so the session is persisted in cookies
// that the middleware and server components can read. (The old client set a
// manual `auth-token` cookie the server never honoured, causing a login loop.)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
