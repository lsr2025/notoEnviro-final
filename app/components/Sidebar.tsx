'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  {
    section: 'Overview',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: '▦' },
    ]
  },
  {
    section: 'Field Operations',
    links: [
      { href: '/log/new', label: 'Log Activity', icon: '＋' },
      { href: '/history', label: 'Activity History', icon: '☰' },
      { href: '/sites', label: 'Sites', icon: '◎' },
    ]
  },
  {
    section: 'Account',
    links: [
      { href: '/profile', label: 'My Profile', icon: '◯' },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Don't render sidebar on login page
  if (pathname === '/') return null

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>NotoEnviro</h1>
        <p>SEF Environmental Tracker</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link${pathname === link.href || pathname.startsWith(link.href + '/') ? ' active' : ''}`}
              >
                <span style={{ fontSize: '14px', lineHeight: 1 }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={handleSignOut}
          className="sidebar-link"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <span style={{ fontSize: '14px' }}>⎋</span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
