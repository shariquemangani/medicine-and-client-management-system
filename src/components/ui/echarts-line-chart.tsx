'use client'

import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts/core'
import { LineChart, LineSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  GridComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption,
  TitleComponent,
  TitleComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register only what we need (tree-shaking friendly)
echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

type EChartsOption = echarts.ComposeOption<
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | TitleComponentOption
>

export interface LineChartSeries {
  /** Series name shown in legend & tooltip */
  name: string
  /** Data points – same length as `xAxisData` */
  data: (number | null)[]
  /** Line color */
  color?: string
  /** Dashed line style */
  dashed?: boolean
  /** Fill area under the line */
  areaStyle?: boolean
  /** Area fill color (defaults to semi-transparent `color`) */
  areaColor?: string
  /** Show circle markers on each data point */
  showSymbol?: boolean
  /** Which data-point indices to show a label on */
  labelIndices?: number[]
}

export interface EChartsLineChartProps {
  /** Chart title displayed top-left */
  title?: string
  /** X-axis categories */
  xAxisData: string[]
  /** One or more line series */
  series: LineChartSeries[]
  /** Chart height (CSS value) */
  height?: string | number
  /** Chart width (CSS value, defaults to 100%) */
  width?: string | number
  /** Y-axis min value */
  yMin?: number
  /** Y-axis max value */
  yMax?: number
  /** Extra className on the wrapper div */
  className?: string
}

/**
 * EChartsLineChart
 *
 * A reusable, lightweight line-chart component built on Apache ECharts
 * (tree-shaken imports, no heavy bundle).
 *
 * @example
 * ```tsx
 * <EChartsLineChart
 *   title="Weight Trend (Last 10 Weeks)"
 *   xAxisData={['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10']}
 *   series={[
 *     {
 *       name: 'Actual Weight',
 *       data: [72, 71.5, 71.2, 70.8, 70.2, 69.6, 69.1, 68.8, 68.6, 68.5],
 *       color: '#2563EB',
 *       areaStyle: true,
 *       showSymbol: true,
 *       labelIndices: [0, 4, 9],
 *     },
 *     {
 *       name: 'Target Path',
 *       data: [72, 71.4, 70.9, 70.3, 69.8, 69.2, 68.7, 68.1, 67.6, 67],
 *       color: '#22C55E',
 *       dashed: true,
 *       showSymbol: false,
 *     },
 *   ]}
 *   height={300}
 *   yMin={67}
 *   yMax={73}
 * />
 * ```
 */
export function EChartsLineChart({
  title,
  xAxisData,
  series,
  height = 300,
  width = '100%',
  yMin,
  yMax,
  className = '',
}: EChartsLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  // Build ECharts option from props
  const buildOption = (): EChartsOption => ({
    title: title
      ? {
          text: title,
          left: 0,
          top: 0,
          textStyle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#1e293b',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
        }
      : undefined,

    legend: {
      right: 0,
      top: 0,
      itemGap: 20,
      icon: 'circle',
      textStyle: {
        fontSize: 12,
        color: '#64748b',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      },
      // Custom formatter to show dashed icon for dashed series
      formatter: (name: string) => name,
    },

    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: '#1e293b',
        fontSize: 12,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#cbd5e1',
          width: 1,
          type: 'dashed',
        },
      },
    },

    grid: {
      top: title ? 52 : 20,
      left: 10,
      right: 10,
      bottom: 10,
      containLabel: true,
    },

    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      },
      splitLine: { show: false },
    },

    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
          type: 'solid',
        },
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },

    series: series.map(s => {
      const lineColor = s.color ?? '#2563EB'
      const areaColor =
        s.areaColor ??
        (s.areaStyle
          ? lineColor.replace(')', ', 0.12)').replace('rgb(', 'rgba(')
          : undefined)

      return {
        name: s.name,
        type: 'line',
        smooth: false,
        data: s.data,
        symbol: s.showSymbol === false ? 'none' : 'circle',
        symbolSize: 7,
        showSymbol: s.showSymbol !== false,
        itemStyle: {
          color: lineColor,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        lineStyle: {
          color: lineColor,
          width: 2.5,
          type: s.dashed ? 'dashed' : 'solid',
        },
        ...(s.areaStyle
          ? {
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: `${lineColor}26` },
                  { offset: 1, color: `${lineColor}05` },
                ]),
              },
            }
          : {}),
        label: {
          show: false,
        },
        // Show labels on specific indices only
        markPoint: s.labelIndices?.length
          ? {
              symbol: 'none',
              data: s.labelIndices.map(idx => ({
                coord: [xAxisData[idx], s.data[idx]],
                value: s.data[idx],
                label: {
                  show: true,
                  formatter: `{c}`,
                  position: 'top',
                  color: '#1e293b',
                  fontSize: 11,
                  fontWeight: '600',
                  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                  backgroundColor: 'transparent',
                  padding: 0,
                },
              })),
            }
          : undefined,
      } as LineSeriesOption
    }),
  })

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return
    const chart = echarts.init(containerRef.current, undefined, {
      renderer: 'canvas',
    })
    chartRef.current = chart
    chart.setOption(buildOption())

    // Resize observer
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update option when props change
  useEffect(() => {
    chartRef.current?.setOption(buildOption(), { notMerge: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, xAxisData, series, yMin, yMax])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  )
}
