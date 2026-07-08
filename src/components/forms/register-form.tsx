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
import { register, clearError } from '@/redux/slices'
import { ROUTES } from '@/lib/routes'
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Lock,
  User,
  ArrowRight,
} from 'lucide-react'

type RegisterFormValues = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

interface RegisterFormProps {
  variant?: 'default' | 'immersive'
}

export function RegisterForm({ variant = 'default' }: RegisterFormProps) {
  const dispatch = useAppDispatch()
  const { error } = useAppSelector((s) => s.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const schema = useMemo(
    () =>
      z
        .object({
          fullName: z.string().min(2, 'Full name must be at least 2 characters'),
          email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
          password: z.string().min(6, 'Password must be at least 6 characters'),
          confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        }),
    []
  )

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true)
    const result = await dispatch(
      register({
        fullName: values.fullName.trim().replace(/\s+/g, ' '),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })
    )
    if (register.fulfilled.match(result)) {
      window.location.assign(ROUTES.dashboard)
      return
    }
    setSubmitting(false)
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
              name="fullName"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="login-card-label">{'Full name'}</FormLabel>
                  <FormControl>
                    <div className="login-card-field">
                      <User className="login-card-field-icon" aria-hidden />
                      <Input
                        type="text"
                        placeholder={'Your full name'}
                        className="login-card-input"
                        autoComplete="name"
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
                  <FormLabel className="login-card-label">{'Password'}</FormLabel>
                  <FormControl>
                    <div className="login-card-field">
                      <Lock className="login-card-field-icon" aria-hidden />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={'Password'}
                        className="login-card-input login-card-input-password"
                        autoComplete="new-password"
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="login-card-label">{'Confirm password'}</FormLabel>
                  <FormControl>
                    <div className="login-card-field">
                      <Lock className="login-card-field-icon" aria-hidden />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={'Confirm password'}
                        className="login-card-input login-card-input-password"
                        autoComplete="new-password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="login-card-field-toggle"
                        aria-label={
                          showConfirmPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {'Creating account...'}
                </>
              ) : (
                <>
                  {'Create account'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          {'Already have an account?'}{' '}
          <Link href="/" className="login-card-link font-medium">
            {'Sign in'}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{'Create your account'}</h1>
        <p className="text-sm text-muted-foreground">{'Register to manage patients, medicines, and pharmacy operations'}</p>
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
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{'Full name'}</FormLabel>
                <FormControl>
                  <Input placeholder={'Your full name'} className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <Input
                    type="password"
                    placeholder={'Password'}
                    className="h-11"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{'Confirm password'}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={'Confirm password'}
                    className="h-11"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {'Creating account...'}
              </>
            ) : (
              'Register'
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {'Already have an account?'}{' '}
        <Link href="/" className="font-medium text-primary hover:underline">
          {'Sign in'}
        </Link>
      </p>
    </div>
  )
}
