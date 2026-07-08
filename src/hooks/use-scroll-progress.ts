import { useState, useRef, useCallback, UIEvent } from 'react'

export interface UseScrollProgressOptions {
  totalSteps: number
}

export function useScrollProgress({ totalSteps }: UseScrollProgressOptions) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const maxScroll = container.scrollWidth - container.clientWidth
    if (maxScroll <= 0) return
    const progress = container.scrollLeft / maxScroll
    setScrollProgress(progress)
  }, [])

  const scrollToStep = useCallback((index: number) => {
    const container = scrollContainerRef.current
    if (!container) return
    const maxScroll = container.scrollWidth - container.clientWidth
    if (maxScroll <= 0) return
    const targetScrollLeft = (index / (totalSteps - 1)) * maxScroll
    container.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth',
    })
  }, [totalSteps])

  const scrollPrev = useCallback(() => {
    const currentIndex = Math.round(scrollProgress * (totalSteps - 1))
    scrollToStep(Math.max(0, currentIndex - 1))
  }, [scrollProgress, scrollToStep, totalSteps])

  const scrollNext = useCallback(() => {
    const currentIndex = Math.round(scrollProgress * (totalSteps - 1))
    scrollToStep(Math.min(totalSteps - 1, currentIndex + 1))
  }, [scrollProgress, scrollToStep, totalSteps])

  return {
    scrollContainerRef,
    scrollProgress,
    handleScroll,
    scrollToStep,
    scrollPrev,
    scrollNext,
    currentIndex: Math.round(scrollProgress * (totalSteps - 1)),
    isAtStart: scrollProgress <= 0.05,
    isAtEnd: scrollProgress >= 0.95,
  }
}
