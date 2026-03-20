import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineBanner } from '@/components/OfflineBanner';

export const metadata: Metadata = {
  title: 'NotoEnviro',
  description: 'Offline-first PWA for eco-worker activity logging at dam sites',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D7A6B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NotoEnviro" />
      </head>
      <body className="bg-dark">
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
