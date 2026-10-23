import '@/styles/globals.css'
import { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Poppins } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ReduxProvider } from '@/redux/provider'
import { ThemeProvider } from '@/components/theme-provider'
import { OfflineOverlay } from '@/components/offline-overlay'
import { Toaster } from 'sonner'
import { ToastProvider } from '@/context/ToastContext'

// The CSP nonce (set per request in middleware) can only be stamped on server-rendered HTML, so
// pages must not be prerendered statically.
export const dynamic = 'force-dynamic'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: { default: 'MediFlow — Homeopathy Medicine Management', template: '%s | MediFlow' },
  description: 'Homeopathy clinic management — patients, medicine vault, prescriptions, and billing',
  applicationName: 'MediFlow',
  manifest: '/manifest.json',
  // Private clinic application (public/robots.txt also disallows crawling).
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Nonce minted per request in middleware; next-themes' inline script must carry it to run under the CSP.
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <head />
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground antialiased font-poppins"
      >
        <ThemeProvider defaultTheme="light" storageKey="theme" nonce={nonce}>
          <ReduxProvider>
            <ToastProvider>
              <OfflineOverlay />
              {children}
              <Toaster position="top-center" />
              {process.env.VERCEL ? <SpeedInsights /> : null}
            </ToastProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
