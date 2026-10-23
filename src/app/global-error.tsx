'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Last-resort boundary: catches errors thrown by the root layout or its providers, where the normal
 * `error.tsx` cannot render. It replaces the whole document, so it carries its own html/body and
 * uses plain inline styles (no providers or global CSS are guaranteed to exist here).
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#ffffff',
          color: '#171717',
        }}
      >
        <main role="alert" style={{ textAlign: 'center', padding: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#525252', marginBottom: '1rem' }}>
            The app could not load. Try again, or return to the sign-in page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ padding: '0.5rem 1rem', marginRight: '0.5rem', cursor: 'pointer' }}
          >
            Try again
          </button>
          {/* Plain anchor on purpose: the router and providers may be what failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ padding: '0.5rem 1rem', color: '#171717' }}>
            Back to sign in
          </a>
        </main>
      </body>
    </html>
  )
}
