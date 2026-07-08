import { LoginLinesBackground } from '@/components/auth/login-lines-background'
import { LoginExperience } from '@/components/auth/login-experience'

export default function LoginPage() {
  return (
    <div className="login-page-shell">
      <LoginLinesBackground className="fixed inset-0 -z-10" />
      <LoginExperience />
    </div>
  )
}
