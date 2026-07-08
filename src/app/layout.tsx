import '@/styles/globals.css'
import { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ReduxProvider } from '@/redux/provider'
import { ThemeProvider, OfflineOverlay } from '@/components'
import { Toaster } from 'sonner'
import { ToastProvider } from '@/context/ToastContext'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'MediFlow — Homeopathy Medicine Management',
  description: 'Homeopathy clinic management — patients, medicine vault, prescriptions, and billing',
  applicationName: 'MediFlow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <head />
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground antialiased font-poppins"
      >
        <ThemeProvider defaultTheme="light" storageKey="theme">
          <ReduxProvider>
            <ToastProvider>
              <OfflineOverlay />
              {children}
              <Toaster position="top-center" />
              <SpeedInsights />
            </ToastProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
