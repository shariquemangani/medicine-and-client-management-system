'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MetricAccentKey } from '@/utils/theme'
import { t } from '@/lib/labels'

interface CarouselSlide {
  id: string
  icon: LucideIcon
  labelKey: string
  metric: MetricAccentKey | 'dashboard'
}

const carouselSlides: CarouselSlide[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', metric: 'dashboard' },
  { id: 'patients', icon: Users, labelKey: 'nav.patients', metric: 'patients' },
  { id: 'inventory', icon: ClipboardCheck, labelKey: 'nav.inventory', metric: 'inventory' },
  { id: 'prescriptions', icon: FileText, labelKey: 'nav.prescriptions', metric: 'prescriptions' },
  { id: 'billing', icon: Wallet, labelKey: 'nav.billing', metric: 'fees' },
]

const SLIDE_COUNT = carouselSlides.length
const SLIDE_ANGLE = 360 / SLIDE_COUNT
const AUTO_ADVANCE_MS = 4500

interface Login3DSceneProps {
  className?: string
}

function SlidePreview({ id }: { id: string }) {
  if (id === 'dashboard') {
    return (
      <div className="login-saas-3d-preview-dashboard">
        <div className="login-saas-3d-preview-stat-grid">
          {[72, 48, 88, 56].map((h, i) => (
            <div key={i} className="login-saas-3d-preview-stat">
              <span className="login-saas-3d-preview-stat-bar" style={{ height: `${h}%` }} />
              <span className="login-saas-3d-preview-stat-line" />
            </div>
          ))}
        </div>
        <div className="login-saas-3d-preview-rows">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="login-saas-3d-preview-row" />
          ))}
        </div>
      </div>
    )
  }

  if (id === 'patients') {
    return (
      <div className="login-saas-3d-preview-patients">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="login-saas-3d-preview-patient-row">
            <span className="login-saas-3d-preview-avatar" />
            <span className="login-saas-3d-preview-row" />
          </div>
        ))}
      </div>
    )
  }

  if (id === 'inventory') {
    return (
      <div className="login-saas-3d-preview-attendance">
        <div className="login-saas-3d-preview-bars">
          {[65, 82, 74, 90, 78].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="login-saas-3d-preview-attendance-meta">
          <span className="login-saas-3d-preview-pill">92%</span>
          <span className="login-saas-3d-preview-caption-line" />
        </div>
      </div>
    )
  }

  if (id === 'prescriptions') {
    return (
      <div className="login-saas-3d-preview-exams">
        {[
          { grade: 'A', width: '88%' },
          { grade: 'B', width: '72%' },
          { grade: 'A', width: '94%' },
        ].map(({ grade, width }, i) => (
          <div key={i} className="login-saas-3d-preview-exam-row">
            <span className="login-saas-3d-preview-grade">{grade}</span>
            <span className="login-saas-3d-preview-score-track">
              <span className="login-saas-3d-preview-score-fill" style={{ width }} />
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="login-saas-3d-preview-fees">
      <div className="login-saas-3d-preview-fee-header">
        <span className="login-saas-3d-preview-fee-amount" />
        <span className="login-saas-3d-preview-pill login-saas-3d-preview-pill-fees">72%</span>
      </div>
      <span className="login-saas-3d-preview-fee-bar" />
      <span className="login-saas-3d-preview-caption-line login-saas-3d-preview-caption-line-short" />
    </div>
  )
}

function SlideCard({
  id,
  icon: Icon,
  labelKey,
  metric,
  index,
}: CarouselSlide & { index: number }) {

  return (
    <div className="login-saas-3d-slide-card">
      <div className="login-saas-3d-slide-card-depth">
        <div className="login-saas-3d-slide-card-layer login-saas-3d-slide-card-back" />
        <div className="login-saas-3d-slide-card-layer login-saas-3d-slide-card-edge login-saas-3d-slide-card-edge-right" />
        <div className="login-saas-3d-slide-card-layer login-saas-3d-slide-card-edge login-saas-3d-slide-card-edge-left" />
        <div className="login-saas-3d-slide-card-layer login-saas-3d-slide-card-edge login-saas-3d-slide-card-edge-bottom" />

        <div className="login-saas-3d-slide-card-face">
          <div
            className={cn(
              'login-saas-3d-slide-accent',
              metric !== 'dashboard' && `login-saas-3d-slide-accent-${metric}`
            )}
          />
          <div className="login-saas-3d-slide-head">
            <div className={cn('login-saas-3d-slide-icon', `login-saas-3d-slide-icon-${id}`)}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="login-saas-3d-slide-eyebrow">{'Core modules'}</p>
              <p className="login-saas-3d-slide-title">{t(labelKey)}</p>
            </div>
          </div>
          <div className="login-saas-3d-slide-body">
            <SlidePreview id={id} />
          </div>
          <div className="login-saas-3d-slide-foot">
            <span className="login-saas-3d-slide-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="login-saas-3d-slide-divider" />
            <span className="login-saas-3d-slide-total">{String(SLIDE_COUNT).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Login3DScene({ className }: Login3DSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [rotationStep, setRotationStep] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const activeIndex = ((rotationStep % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT

  const goToSlide = useCallback((index: number) => {
    setRotationStep((prev) => {
      const current = ((prev % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT
      let delta = index - current
      if (delta < 0) delta += SLIDE_COUNT
      return prev + delta
    })
  }, [])

  const goNext = useCallback(() => {
    setRotationStep((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setReduceMotion(media.matches)
    syncMotion()
    media.addEventListener('change', syncMotion)
    return () => media.removeEventListener('change', syncMotion)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reduceMotion || !isVisible || document.hidden) return

    const timer = window.setInterval(goNext, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [goNext, reduceMotion, isVisible])

  const activeSlide = carouselSlides[activeIndex]

  return (
    <div
      ref={rootRef}
      className={cn('login-saas-3d hidden lg:flex flex-col items-center justify-center', className)}
      aria-hidden
    >
      <div className="login-saas-3d-viewport">
        <div className="login-saas-3d-stage">
          <div className="login-saas-3d-orbit-track" />
          <div className="login-saas-3d-orbit-track login-saas-3d-orbit-track-inner" />

          <div
            className="login-saas-3d-carousel"
            style={
              {
                '--carousel-rotate': `${-rotationStep * SLIDE_ANGLE}deg`,
              } as React.CSSProperties
            }
          >
            {carouselSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  'login-saas-3d-slide',
                  `login-saas-3d-slide-${slide.id}`,
                  index === activeIndex && 'login-saas-3d-slide-active'
                )}
                style={
                  {
                    '--slide-angle': `${index * SLIDE_ANGLE}deg`,
                  } as React.CSSProperties
                }
              >
                <SlideCard {...slide} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-saas-3d-scroll">
        <div className="login-saas-3d-dots" role="presentation">
          {carouselSlides.map(({ id }, index) => (
            <button
              key={id}
              type="button"
              tabIndex={-1}
              aria-hidden
              className={cn('login-saas-3d-dot', index === activeIndex && 'login-saas-3d-dot-active')}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
        <p className="login-saas-3d-scroll-label">
          {String(activeIndex + 1).padStart(2, '0')} / {String(SLIDE_COUNT).padStart(2, '0')} ·{' '}
          {t(activeSlide.labelKey)}
        </p>
      </div>

      <div className="login-saas-3d-caption">
        <p className="login-saas-3d-caption-title">{'MediFlow'}</p>
        <p className="login-saas-3d-caption-sub">{t(activeSlide.labelKey)}</p>
      </div>
    </div>
  )
}
