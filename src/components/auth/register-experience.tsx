import { RegisterForm } from '@/components/forms'
import { RegisterCard } from './register-card'
import { ModeToggle } from '@/components/mode-toggle'
import { LayoutGrid } from 'lucide-react'

export function RegisterExperience() {

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="login-header-brand-icon">
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </div>
          <div className="hidden sm:block">
            <p className="login-header-brand-title">{'MediFlow'}</p>
            <p className="login-header-brand-subtitle">{'Homeopathy Medicine Management'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle className="login-header-control h-9 w-9 rounded-full border" />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-130px)] max-w-7xl items-center justify-center px-4 pb-8 sm:px-8">

        <div className="flex w-full justify-center">
          <RegisterCard>
            <RegisterForm variant="immersive" />
          </RegisterCard>
        </div>
      </div>

      <footer className="relative z-10 w-[90%] mx-auto pb-2 text-center text-xs login-footer-text">
        © {new Date().getFullYear()} {'MediFlow'} · {'Homeopathy clinic management software'}
      </footer>
    </>
  )
}
