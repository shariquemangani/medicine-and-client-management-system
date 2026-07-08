'use client'

import React, { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { X, Sun, Droplet, Calendar, Syringe, Activity } from 'lucide-react'
import { format, isValid } from 'date-fns'
import * as echarts from 'echarts/core'
import { LineChart, LineSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  MarkAreaComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'

echarts.use([
  LineChart,
  GridComponent,
  MarkAreaComponent,
  TooltipComponent,
  CanvasRenderer,
])

export type BloodStatus = 'Improving' | 'Declined' | 'Stable' | 'Resolved' | ''

export interface BloodParameterData {
  id: string
  title: string
  iconType: 'sun' | 'butterfly' | 'drop' | 'syringe' | 'default'
  status: BloodStatus
  normalRangeText: string
  normalMin: number
  normalMax: number
  unit: string
  baseline: { value: number | string; label: string }
  month1: { value: number | string; label: string }
  month2: { value: number | string; label: string }
  current: { value: number | string; label: string }
}

export interface BloodParameterGraphCardProps {
  data: BloodParameterData
  mode: 'view' | 'edit'
  onChange?: (data: BloodParameterData) => void
  onRemove?: () => void
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  Improving: { bg: 'bg-[#e0f2fe]', text: 'text-[#3b82f6]' },
  Declined: { bg: 'bg-[#ffe4e6]', text: 'text-[#f43f5e]' },
  Stable: { bg: 'bg-[#f3e8ff]', text: 'text-[#a855f7]' },
  Resolved: { bg: 'bg-[#dcfce7]', text: 'text-[#10b981]' },
  '': { bg: 'bg-slate-100', text: 'text-slate-500' },
}

const pointColors = ['#f43f5e', '#f97316', '#3b82f6', '#10b981']

const IconMap = {
  sun: <Sun className="w-5 h-5 text-amber-500" />,
  butterfly: <Activity className="w-5 h-5 text-blue-500" />,
  drop: <Droplet className="w-5 h-5 text-red-500" />,
  syringe: <Syringe className="w-5 h-5 text-slate-400" />,
  default: <Activity className="w-5 h-5 text-slate-500" />,
}

export function BloodParameterGraphCard({
  data,
  mode,
  onChange,
  onRemove,
}: BloodParameterGraphCardProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const echartInstance = useRef<echarts.ECharts | null>(null)

  const {
    title,
    iconType,
    status,
    normalRangeText,
    normalMin,
    normalMax,
    unit,
    baseline,
    month1,
    month2,
    current,
  } = data

  const currentStatusConfig = status ? statusConfig[status] : statusConfig['']

  // Ensure values are numbers for the chart
  const val0 = Number(baseline.value) || 0
  const val1 = Number(month1.value) || 0
  const val2 = Number(month2.value) || 0
  const val3 = Number(current.value) || 0

  useEffect(() => {
    if (!chartRef.current) return

    if (!echartInstance.current) {
      echartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      })
    }

    const minArr = Math.min(val0, val1, val2, val3, normalMin)
    const maxArr = Math.max(val0, val1, val2, val3, normalMax)
    const padding = (maxArr - minArr) * 0.3

    const option = {
      grid: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: ['B', 'M1', 'M2', 'C'],
        show: false,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        show: false,
        min: minArr - padding,
        max: maxArr + padding,
      },
      series: [
        {
          type: 'line',
          data: [val0, val1, val2, val3],
          symbol: 'circle',
          symbolSize: 10,
          lineStyle: {
            color: '#10b981', // Solid dark green line connecting points
            width: 2,
          },
          itemStyle: {
            color: (params: any) => pointColors[params.dataIndex] || '#10b981',
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              // only show label on first and last if needed, or all. The image shows small labels on some.
              return '' // we will hide them as we use HTML for bottom labels
            },
            color: '#94a3b8',
            fontSize: 10,
          },
          markArea: {
            itemStyle: {
              color: 'rgba(16, 185, 129, 0.15)', // Light green shade for normal range
            },
            data: [
              [
                {
                  yAxis: normalMin,
                  name: 'Normal Range',
                  label: {
                    show: true,
                    position: 'insideTopLeft',
                    color: '#059669',
                    fontSize: 10,
                    fontWeight: 500,
                  },
                },
                {
                  yAxis: normalMax,
                },
              ],
            ],
          },
        },
      ],
      tooltip: {
        show: true,
        trigger: 'axis',
        formatter: `{c} ${unit}`,
      },
    }

    echartInstance.current.setOption(option)

    const resizeObserver = new ResizeObserver(() => {
      echartInstance.current?.resize()
    })
    resizeObserver.observe(chartRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [val0, val1, val2, val3, normalMin, normalMax, unit])

  const handleChange = (field: keyof BloodParameterData, value: any) => {
    if (onChange) {
      onChange({ ...data, [field]: value })
    }
  }

  const handleNestedChange = (
    period: 'baseline' | 'month1' | 'month2' | 'current',
    field: 'value' | 'label',
    value: string
  ) => {
    if (onChange) {
      onChange({
        ...data,
        [period]: { ...data[period], [field]: value },
      })
    }
  }

  const renderValueBlock = (
    index: number,
    period: 'baseline' | 'month1' | 'month2' | 'current',
    obj: { value: number | string; label: string },
    defaultLabel: string
  ) => {
    const colorClass = pointColors[index]

    // Convert hex to tailwind text class mapping (rough approximation for rendering)
    let tc = 'text-slate-800'
    if (index === 0) tc = 'text-rose-500'
    if (index === 1) tc = 'text-orange-500'
    if (index === 2) tc = 'text-blue-500'
    if (index === 3) tc = 'text-emerald-500'

    if (mode === 'edit') {
      const isDatePeriod = period === 'month1' || period === 'month2'
      const parsedDate =
        isDatePeriod && obj.label ? new Date(obj.label) : undefined
      const validDate =
        parsedDate && isValid(parsedDate) ? parsedDate : undefined

      return (
        <div className="flex flex-col items-center flex-1">
          <Input
            value={obj.value}
            onChange={e => handleNestedChange(period, 'value', e.target.value)}
            className={`h-8 w-16 text-center font-bold text-lg p-0 border-slate-200 outline-none focus-visible:ring-1 ${tc}`}
          />
          {isDatePeriod ? (
            <div className="mt-2">
              <DatePicker
                value={validDate}
                onChange={date => {
                  if (date) {
                    handleNestedChange(
                      period,
                      'label',
                      format(date, 'yyyy-MM-dd')
                    )
                  } else {
                    handleNestedChange(period, 'label', '')
                  }
                }}
                placeholder={defaultLabel}
                className="h-7 w-[110px] px-2 py-0 text-[10px] bg-slate-800 text-white rounded-full border-0 hover:bg-slate-700 shadow-sm [&>span]:text-white [&>svg]:text-white/70 [&>svg]:w-3 [&>svg]:h-3"
              />
            </div>
          ) : (
            <div className="text-[9px] font-semibold text-slate-400 mt-2 tracking-wider uppercase">
              {defaultLabel}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center flex-1">
        <div className={`text-lg font-bold ${tc}`}>
          {obj.value}
          {unit === '%' && period === 'baseline' ? '%' : ''}
        </div>
        <div className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider text-center">
          {(() => {
            if (period === 'month1' || period === 'month2') {
              const d = obj.label ? new Date(obj.label) : undefined
              if (d && isValid(d)) {
                return format(d, 'MMM d, yyyy')
              }
            }
            return obj.label || defaultLabel
          })()}
        </div>
      </div>
    )
  }

  return (
    <Card className="relative bg-slate-50/30 border border-slate-100 rounded-[20px] p-5 w-full flex flex-col hover:border-slate-200 transition-colors">
      {/* Remove Button in Edit Mode */}
      {mode === 'edit' && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 p-1 rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            {IconMap[iconType] || IconMap['default']}
          </div>
          <div className="flex flex-col">
            {mode === 'edit' ? (
              <Input
                value={title}
                onChange={e => handleChange('title', e.target.value)}
                className="h-6 w-32 font-semibold text-slate-800 p-0 border-0 bg-transparent text-[15px] focus-visible:ring-1"
                placeholder="Parameter Name"
              />
            ) : (
              <h3 className="font-semibold text-slate-800 text-[15px] leading-tight">
                {title}
              </h3>
            )}
            <div className="text-[12px] text-slate-400 mt-0.5">
              {normalRangeText}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {mode === 'edit' ? (
          <Select
            value={status}
            onValueChange={v => handleChange('status', v as BloodStatus)}
          >
            <SelectTrigger
              className={cn(
                'w-[110px] h-7 border-0 text-xs font-semibold rounded-full',
                currentStatusConfig.bg,
                currentStatusConfig.text
              )}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="Improving"
                className="text-blue-500 text-xs font-semibold"
              >
                Improving
              </SelectItem>
              <SelectItem
                value="Declined"
                className="text-red-500 text-xs font-semibold"
              >
                Declined
              </SelectItem>
              <SelectItem
                value="Stable"
                className="text-purple-500 text-xs font-semibold"
              >
                Stable
              </SelectItem>
              <SelectItem
                value="Resolved"
                className="text-green-500 text-xs font-semibold"
              >
                Resolved
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          status && (
            <div
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold',
                currentStatusConfig.bg,
                currentStatusConfig.text
              )}
            >
              {status}
            </div>
          )
        )}
      </div>

      {/* Embedded Chart */}
      <div className="w-[85%] h-[100px] mx-auto mt-2 relative">
        <div ref={chartRef} className="w-full h-full" />
      </div>

      {/* Bottom Labels Aligning with Chart Vertices */}
      <div className="flex items-start justify-between mt-4 px-2 w-[90%] mx-auto">
        {renderValueBlock(0, 'baseline', baseline, 'BASELINE')}
        {renderValueBlock(1, 'month1', month1, 'MONTH 1')}
        {renderValueBlock(2, 'month2', month2, 'MONTH 2')}
        {renderValueBlock(3, 'current', current, 'CURRENT')}
      </div>
    </Card>
  )
}
