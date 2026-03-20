# NotoEnviro - Eco-Worker Activity Logging PWA

A production-ready Progressive Web App for logging daily environmental activities at dam sites across KwaZulu-Natal.

## Overview

NotoEnviro serves 469 eco-workers across 13 dam sites (Workstream B, Msinsi Holdings). It provides a simple, mobile-first interface for logging attendance and environmental work activities, with full offline-first capabilities.

## Features

- **Offline-First**: All data syncs to Supabase when online, queued for later sync when offline
- **Role-Based Access**: Different dashboards for eco-workers, supervisors, coordinators, executives, and M&E staff
- **5-Step Activity Logging**: Streamlined form for quick daily logging
- **GPS Capture**: Optional location capture for accountability
- **Activity History**: Calendar and list views with streak tracking
- **PWA Support**: Installable on mobile devices, works in airplane mode

## Role Tiers

1. **Executive** (tier 1): Programme overview
2. **District Coordinator** (tier 2): All 13 dam sites, programme-wide stats
3. **Field Supervisor** (tier 3): Specific dam site, worker attendance tracking
4. **Eco-Worker** (tier 4): Personal activity logging and history
5. **M&E / Funder** (tier 5): Reporting and analytics

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

App runs on http://localhost:3001

### Build

```bash
npm run build
npm start
```

## Environment Variables

The following are already configured in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://rwkdcreimzpieennuwnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_APP_NAME=NotoEnviro
NEXT_PUBLIC_WORKSTREAM=B
```

## Authentication

Users log in with:
- **Employee ID**: Format like `YMS-M-FS-001` (supervisor) or `YMS-M-P-001` (eco-worker)
- **Password**: Defaults to employee ID on first login
- **Email**: Auto-generated as `{employee_id}@notoenviro.co.za`

## Database Schema

Activity logs are stored in `notoenviro.activity_logs`:

```sql
id                TEXT PRIMARY KEY
offline_id        TEXT (for offline sync tracking)
worker_id         UUID (references public.users)
site_id           UUID (references notoenviro.sites)
log_date          DATE
is_present        BOOLEAN
activity_type     TEXT (vegetation, litter, water, erosion, alien, infrastructure, other)
activity_details  TEXT
hours_worked      INTEGER (default 8)
gps_lat           DECIMAL
gps_lng           DECIMAL
photo_url         TEXT
status            TEXT (pending, submitted, synced)
created_at        TIMESTAMPTZ
synced_at         TIMESTAMPTZ
```

## Offline Storage

All data uses IndexedDB with database name `notoenviro-offline`:
- **activity_logs store**: All logged activities
- **queue store**: Pending syncs to Supabase

## The 13 Dam Sites

| # | Site | Workers | Supervisor |
|---|------|---------|-----------|
| 1 | Inanda Dam | 75 | ⚠ None |
| 2 | Nagle Dam | 43 | ⚠ None |
| 3 | Albert Falls Dam | 38 | ✓ |
| 4 | Midmar Dam | 35 | ✓ |
| 5 | Hazelmere Dam | 28 | ✓ |
| 6 | Shongweni Dam | 25 | ✓ |
| 7 | Hluhluwe Dam | 30 | ✓ |
| 8 | Pongolapoort Dam | 30 | ✓ |
| 9 | Goedertrouw Dam | 25 | ✓ |
| 10 | Bloemhoek Dam | 25 | ✓ |
| 11 | Mearns Dam | 25 | ✓ |
| 12 | Spring Grove Dam | 25 | ✓ |
| 13 | Wagendrift Dam | 25 | ✓ |

## Colour Palette

- **Dark**: `#0D1B35` (main background)
- **Navy**: `#1A2D5A` (cards/panels)
- **Teal**: `#0D7A6B` (accent, titles)
- **Gold**: `#D4A017` (secondary accent)
- **Green**: `#10B981` (environment theme, CTAs)
- **White**: `#FFFFFF` (text)

## File Structure

```
notoenviro/
├── app/
│   ├── page.tsx                 # Login page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── dashboard/page.tsx       # Role-based dashboard
│   ├── log/new/page.tsx         # 5-step activity form
│   ├── history/page.tsx         # Activity history
│   ├── profile/page.tsx         # User profile
│   └── site/[id]/page.tsx       # Dam site details
├── components/
│   ├── OfflineBanner.tsx        # Online/offline status
│   ├── BottomNav.tsx            # Mobile navigation
│   ├── AttendanceCard.tsx       # Attendance rate display
│   └── DamSiteCard.tsx          # Dam site summary
├── lib/
│   ├── types.ts                 # TypeScript interfaces
│   ├── dam-sites.ts             # Static dam site data
│   ├── offline-db.ts            # IndexedDB utilities
│   ├── supabase.ts              # Supabase client
│   └── supabase-server.ts       # Server-side client
├── public/
│   └── manifest.json            # PWA manifest
├── middleware.ts                # Auth protection
└── tailwind.config.ts           # Tailwind theme
```

## Key Components

### Login Page (`/`)
- Full-screen dark theme with NotoEnviro branding
- Employee ID and password inputs
- Offline indicator

### Dashboard (`/dashboard`)
**Eco-Worker View:**
- Greeting and current date
- Dam site confirmation
- "Log Today's Activity" primary CTA
- Today's log status
- Offline pending count

**Supervisor View:**
- Dam site name
- Attendance rate with progress bar
- Worker list with today's status
- Recent activity logs
- Download report button

**Coordinator View:**
- All 13 dam sites as cards
- Warning badges for Inanda/Nagle (no supervisor)
- Programme-wide statistics

### Activity Log Form (`/log/new`)
5-step guided form:
1. **Attendance**: Are you present? (YES/NO auto-advance)
2. **Dam Site**: Confirm work location
3. **Activity Type**: Select from 7 activity types
4. **Details**: Description and hours worked
5. **GPS**: Capture location and submit

### History (`/history`)
- Calendar or list view toggle
- Monthly attendance overview
- Current streak tracker
- Past activity logs with timestamps

### Profile (`/profile`)
- Worker information and role
- Total logs and current streak
- App version and programme info
- Sign out button

## Offline Architecture

1. User logs activity while offline
2. Data saved to IndexedDB (`notoenviro-offline`)
3. Attempt Supabase sync on submit
4. If offline/fails, save to queue
5. Background sync when online
6. Queue cleared after successful sync

## Deployment

This is a Next.js 14 app with PWA support:

```bash
npm run build
npm start
```

The app will be PWA-enabled in production (disabled in development for easier testing).

## Important Notes

- **Inanda Dam** and **Nagle Dam** have no field supervisor assigned - shown with yellow warning badge
- Mobile-first design optimized for field work on phones
- All timestamps in local time (South Africa)
- Attendance calculation: logged entries count as present
- Minimum 70% attendance triggers yellow warning, <70% red

## Support

For issues or questions, contact the Workstream B coordinator.
