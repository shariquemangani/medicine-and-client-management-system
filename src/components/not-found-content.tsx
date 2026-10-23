import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Stethoscope } from 'lucide-react'
import { ROUTES } from '@/lib/routes'

export function NotFoundContent() {

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-10 text-center max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Stethoscope className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">{'404'}</h1>
        <p className="text-muted-foreground mt-2 mb-6">{'The page you are looking for does not exist.'}</p>
        <Link href={ROUTES.dashboard}>
          <Button>{'Back to Dashboard'}</Button>
        </Link>
      </div>
    </div>
  )
}
