import type { Metadata } from 'next'
import './globals.css'
import Sidebar from './components/Sidebar'

export const metadata: Metadata = {
  title: 'NotoEnviro | SEF Eco-Worker Tracking',
  description: 'Environmental field data tracking for Social Employment Fund',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-yami-bg text-gray-900">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 pt-16 lg:pt-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
