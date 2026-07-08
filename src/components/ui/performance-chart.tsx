'use client'

import React from 'react'

/**
 * PerformanceChart Component
 *
 * A reusable component that displays a circular progress chart with bullet points.
 *
 * Usage:
 * ```tsx
 * <PerformanceChart
 *   data={[
 *     { label: 'Active patients', value: 34, color: '#10203C', trend: '+12%' },
 *     { label: 'LSA', value: 43, color: '#06B6D4', trend: '+8%' },
 *     // ... more data
 *   ]}
 *   size={240}
 *   strokeWidth={16}
 * />
 * ```
 */

interface PerformanceData {
  label: string
  value: number
  color: string
  trend: string
}

interface PerformanceChartProps {
  data: PerformanceData[]
  size?: number
  strokeWidth?: number
  /** When true, only render the donut chart (no bullet points) */
  chartOnly?: boolean
}

export function PerformanceChart({
  data,
  size = 240,
  strokeWidth = 16,
  chartOnly = false,
}: PerformanceChartProps) {
  // Calculate total for percentage distribution
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
  const radius = 45 // SVG coordinate radius
  const circumference = 2 * Math.PI * radius

  // Calculate strokeDasharray for each segment
  let currentOffset = 0
  const segments = data.map((item, index) => {
    const val = Number(item.value) || 0
    const percentage = total > 0 ? val / total : 0
    const dashLength = Math.round(circumference * percentage) || 0
    const gapLength = circumference - dashLength
    const offset = -currentOffset

    currentOffset += dashLength

    return {
      ...item,
      dashArray: `${dashLength} ${gapLength}`,
      dashOffset: offset,
      delay: index * 0.2,
    }
  })

  // Generate gradient IDs
  const gradientIds = data.map((_, index) => `grad${index}`)

  const chartEl = (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className={`relative ${chartOnly ? '' : 'mb-4'}`} style={{ width: size, height: size }}>
          <svg
            className="w-full h-full transform -rotate-90 drop-shadow-lg"
            viewBox="0 0 120 120"
          >
            {/* Background circle with gradient */}
            <defs>
              <linearGradient
                id="bgGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="hsl(var(--muted))" />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--muted-foreground) / 0.2)"
                />
              </linearGradient>

              {/* Dynamic gradients for each data item */}
              {data.map((item, index) => {
                const baseColor = item.color
                const darkerColor =
                  baseColor === '#10203C'
                    ? '#1e3a5f'
                    : baseColor === '#06B6D4'
                      ? '#0891B2'
                      : baseColor === '#3B82F6'
                        ? '#2563EB'
                        : baseColor === '#F59E0B'
                          ? '#D97706'
                          : baseColor === '#22C55E'
                            ? '#16A34A'
                            : baseColor === '#EC4899'
                              ? '#DB2777'
                              : baseColor

                return (
                  <linearGradient
                    key={index}
                    id={`grad${index}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={darkerColor} />
                  </linearGradient>
                )
              })}
            </defs>

            {/* Data segments with animations */}
            {segments.map((segment, index) => (
              <circle
                key={index}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={`url(#grad${index})`}
                strokeWidth={strokeWidth}
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                className="hover:animate-pulse transition-all duration-200 cursor-pointer"
              />
            ))}
          </svg>

          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 blur-lg -z-10"></div>
        </div>
      </div>
  )

  if (chartOnly) return chartEl

  return (
    <div className="flex items-center gap-8 mb-6">
      {chartEl}
      {/* Right Side: Bullet Points */}
      <div className="flex-1 space-y-3">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between group hover:bg-muted/50 p-2 rounded-lg transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-md shadow-sm group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-sm font-medium text-foreground">
                {item.label}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-md font-bold text-foreground">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
