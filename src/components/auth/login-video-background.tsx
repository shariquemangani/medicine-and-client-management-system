'use client'

import { useEffect, useRef, useState } from 'react'

const VIDEO_SOURCES = [
  'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-university-campus-4148-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-young-patients-walking-in-a-university-4265-large.mp4',
]

interface LoginVideoBackgroundProps {
  className?: string
}

export function LoginVideoBackground({ className }: LoginVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [canPlayVideo, setCanPlayVideo] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) {
      setCanPlayVideo(false)
      return
    }

    const video = videoRef.current
    if (!video) return

    const play = async () => {
      try {
        video.muted = true
        await video.play()
      } catch {
        setCanPlayVideo(false)
      }
    }

    play()

    const onVisibility = () => {
      if (document.hidden) video.pause()
      else void play()
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [sourceIndex])

  const handleError = () => {
    setVideoReady(false)
    if (sourceIndex < VIDEO_SOURCES.length - 1) {
      setSourceIndex((i) => i + 1)
    } else {
      setCanPlayVideo(false)
    }
  }

  return (
    <div className={className} aria-hidden>
      <div className="login-video-fallback absolute inset-0" />
      <div className="login-video-mesh absolute inset-0 opacity-60" />

      {canPlayVideo && (
        <video
          ref={videoRef}
          key={VIDEO_SOURCES[sourceIndex]}
          className={`login-video-bg absolute inset-0 h-full w-full object-cover scale-105 transition-opacity duration-1000 ${
            videoReady ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onError={handleError}
        >
          <source src={VIDEO_SOURCES[sourceIndex]} type="video/mp4" />
        </video>
      )}

      <div className="login-video-scrim absolute inset-0" />
      <div className="login-video-scrim-accent-1 absolute inset-0" />
      <div className="login-video-scrim-accent-2 absolute inset-0" />
      <div className="login-video-scrim-vignette absolute inset-0" />
      <div className="login-video-grain absolute inset-0 opacity-[0.04] pointer-events-none" />
    </div>
  )
}
