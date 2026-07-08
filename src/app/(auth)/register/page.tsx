import { LoginLinesBackground } from '@/components/auth/login-lines-background'
import { RegisterExperience } from '@/components/auth/register-experience'

export default function RegisterPage() {
  return (
    <div className="login-page-shell">
      <LoginLinesBackground className="fixed inset-0 -z-10" />
      <RegisterExperience />
    </div>
  )
}
