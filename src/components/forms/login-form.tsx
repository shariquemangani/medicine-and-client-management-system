'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAppDispatch, useAppSelector } from '@/redux'
import { login, clearError } from '@/redux/slices'
import { safeRedirectTarget } from '@/lib/safe-redirect'
import { ROUTES } from '@/lib/routes'
import { authService } from '@/services/auth-services'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Lock,
  ArrowRight,
} from 'lucide-react'

type LoginFormValues = {
  email: string
  password: string
}

interface LoginFormProps {
  variant?: 'default' | 'immersive'
}

export function LoginForm({ variant = 'default' }: LoginFormProps) {
  const dispatch = useAppDispatch()
  const { error } = useAppSelector((s) => s.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const allowRegistration = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'true'

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
      }),
    []
  )

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true)
    const result = await dispatch(
      login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })
    )
    if (login.fulfilled.match(result)) {
      const requested = new URLSearchParams(window.location.search).get('redirect')
      // Only same-origin paths are followed (blocks //evil.com and backslash open redirects).
      const safeRedirect = safeRedirectTarget(requested, window.location.origin)
      window.location.assign(safeRedirect ?? ROUTES.dashboard)
      return
    }
    setSubmitting(false)
  }

  const handleForgotPassword = async () => {
    const email = form.getValues('email').trim()
    if (!email) {
      form.setError('email', { message: 'Enter your email, then choose Forgot password' })
      return
    }
    const result = await authService.requestPasswordReset(email)
    if (result.success) {
      toast.success('If an account exists for that email, a reset link is on its way')
    } else {
      toast.error(result.message)
    }
  }

  const busy = submitting
  const immersive = variant === 'immersive'

  if (immersive) {
    return (
      <div className="space-y-5">
        {error && (
          <Alert variant="destructive" className="login-card-alert [&>svg]:shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm leading-snug">{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="login-card-label">{'Email address'}</FormLabel>
                  <FormControl>
                    <div className="login-card-field">
                      <Mail className="login-card-field-icon" aria-hidden />
                      <Input
                        type="email"
                        placeholder={'you@example.com'}
                        className="login-card-input"
                        autoComplete="email"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="login-card-field-message" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel className="login-card-label">{'Password'}</FormLabel>
                    <button
                      type="button"
                      className="login-card-link"
                      onClick={handleForgotPassword}
                    >
                      {'Forgot?'}
                    </button>
                  </div>
                  <FormControl>
                    <div className="login-card-field">
                      <Lock className="login-card-field-icon" aria-hidden />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={'Password'}
                        className="login-card-input login-card-input-password"
                        autoComplete="current-password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="login-card-field-toggle"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="login-card-field-message" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="login-card-cta group mt-1 h-12 w-full rounded-xl border-0 text-sm font-semibold disabled:opacity-55"
              disabled={busy}
            >
              {busy ? (
                <>
                  {'Signing in...'}
                </>
              ) : (
                <>
                  {'Sign in to dashboard'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </Form>

        {allowRegistration && (
          <p className="text-center text-sm text-muted-foreground">
            {"Don't have an account?"}{' '}
            <Link href="/register" className="login-card-link font-medium">
              {'Create account'}
            </Link>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{'Admin Login'}</h1>
        <p className="text-sm text-muted-foreground">{'Sign in to manage patients, medicines, and pharmacy operations'}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{'Email'}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={'you@example.com'}
                    className="h-11"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{'Password'}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={'Password'}
                      className="h-11 pr-10"
                      autoComplete="current-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={handleForgotPassword}
            >
              {'Forgot password?'}
            </button>
            {allowRegistration && (
              <Link href="/register" className="text-muted-foreground transition-colors hover:text-foreground">
                {'Create account'}
              </Link>
            )}
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? (
              <>
                {'Signing in...'}
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
