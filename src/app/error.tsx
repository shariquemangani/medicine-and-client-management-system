'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center"
    >
      <h1 className="text-2xl font-bold text-foreground">An Error Occurred</h1>
      <p className="text-muted-foreground">Sorry, something went wrong.</p>
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
