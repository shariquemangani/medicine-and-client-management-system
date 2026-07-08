'use client'

import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, BarSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  GridComponentOption,
  TooltipComponent,
  TooltipComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

type EChartsOption = echarts.ComposeOption<
  BarSeriesOption | GridComponentOption | TooltipComponentOption
>

export interface EChartsBarChartProps {
  xAxisData: string[]
  data: number[]
  color?: string
  height?: string | number
  width?: string | number
  yMin?: number
  yMax?: number
  yAxisFormatter?: (value: number) => string
  className?: string
}

export function EChartsBarChart({
  xAxisData,
  data,
  color = '#8B5CF6',
  height = 300,
  width = '100%',
  yMin = 0,
  yMax = 100,
  yAxisFormatter = v => `${v}%`,
  className = '',
}: EChartsBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current)
    }

    const option: EChartsOption = {
      grid: { left: 48, right: 24, top: 24, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const items = params as { axisValue: string; value: number }[]
          if (!Array.isArray(items) || !items.length) return ''
          return `${items[0].axisValue}<br/>${yAxisFormatter(items[0].value)}`
        },
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#9CA3AF', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 11,
          formatter: (value: number) => yAxisFormatter(value),
        },
      },
      series: [
        {
          type: 'bar',
          data,
          barWidth: '45%',
          itemStyle: {
            color,
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
    }

    chartRef.current.setOption(option)

    const handleResize = () => chartRef.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [xAxisData, data, color, yMin, yMax, yAxisFormatter])

  useEffect(() => {
    return () => {
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
    />
  )
}
