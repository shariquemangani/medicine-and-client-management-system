'use client'

import React from 'react'

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color: string
  type?: 'filled' | 'line'
  className?: string
  showLabel?: boolean
  label?: string
  subLabel?: string
  labelClassName?: string
}

export function CircularProgress({
  percentage,
  size = 128,
  strokeWidth = 8,
  color,
  type = 'line',
  className = '',
  showLabel = true,
  label,
  subLabel,
  labelClassName = 'text-2xl font-medium',
}: CircularProgressProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - percentage / 100)

  if (type === 'filled') {
    // Calculate the angle for the filled portion (from -90 degrees to show progress)
    const angle = (percentage / 100) * 360 - 90
    const startAngle = -90
    const endAngle = angle

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    // Calculate the path for the filled portion
    const x1 = size / 2 + radius * Math.cos(startRad)
    const y1 = size / 2 + radius * Math.sin(startRad)
    const x2 = size / 2 + radius * Math.cos(endRad)
    const y2 = size / 2 + radius * Math.sin(endRad)

    const largeArcFlag = percentage > 50 ? 1 : 0

    const pathData =
      percentage === 100
        ? `M ${size / 2} ${size / 2 - radius} A ${radius} ${radius} 0 1 1 ${size / 2} ${size / 2 + radius} A ${radius} ${radius} 0 1 1 ${size / 2} ${size / 2 - radius} Z`
        : `M ${size / 2} ${size / 2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

    return (
      <div
        className={`relative group cursor-pointer mx-auto mb-4 ${className}`}
        style={{ width: size, height: size }}
      >
        {/* Outer glow effect */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
          style={{
            background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />

        {/* Main container with glass morphism */}
        <div
          className="relative rounded-full transition-all duration-500 ease-out "
          style={{
            backdropFilter: 'blur(10px)',
          }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="drop-shadow-sm"
          >
            {/* Background circle with subtle gradient */}
            <defs>
              <radialGradient
                id={`bg-${color.replace('#', '')}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor={`${color}50`} />
                <stop offset="100%" stopColor={`${color}50`} />
              </radialGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill={`url(#bg-${color.replace('#', '')})`}
              className="transition-all duration-700 ease-out"
            />

            {/* Progress filled portion with enhanced styling */}
            <path
              d={pathData}
              fill={color}
              className="transition-all duration-1000 ease-out drop-shadow-sm"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
              }}
            />

            {/* Inner highlight for depth */}
            {/* <circle
              cx={size / 2}
              cy={size / 2 - radius * 0.3}
              r={radius * 0.15}
              fill="rgba(255, 255, 255, 0.3)"
              className="transition-all duration-700 ease-out"
            /> */}
          </svg>
        </div>

        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center transform transition-all duration-500 ease-out ">
              <div
                className={`${labelClassName} text-gray-900 transition-all duration-300 ease-out`}
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                {label || `${percentage}%`}
              </div>
              {subLabel && (
                <div className=" text-xs text-gray-600 font-medium transition-all duration-300 ease-out">
                  {subLabel}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Line type (default)
  return (
    <div
      className={`relative group cursor-pointer ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
        style={{
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          filter: 'blur(15px)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Main container with glass morphism */}
      <div
        className="relative rounded-full transition-all duration-500 ease-out "
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle with subtle styling */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white transition-all duration-700 ease-out"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))',
            }}
          />

          {/* Progress circle with enhanced styling */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              // filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))',
              strokeLinecap: 'round',
            }}
          />

          {/* Animated progress trail effect */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 0.3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="opacity-30 transition-all duration-1000 ease-out"
            style={{
              filter: 'blur(1px)',
            }}
          />
        </svg>
      </div>

      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center transform transition-all ">
            <div
              className={`${labelClassName} text-gray-900 transition-all duration-300 ease-out`}
              style={{
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              }}
            >
              {label || `${percentage}`}
            </div>
            {subLabel && (
              <div className="mt-1 text-xs text-gray-600 font-medium transition-all duration-300 ease-out">
                {subLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
