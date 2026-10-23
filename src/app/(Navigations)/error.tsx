'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SectionErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/** A page crashed: keep the sidebar and show the problem inside the content area. */
export default function SectionError({ error, reset }: SectionErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div role="alert" className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">This page hit a problem</h1>
      <p className="text-muted-foreground">Sorry, something went wrong while showing this page.</p>
      <div className="flex flex-row gap-2">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  )
}
