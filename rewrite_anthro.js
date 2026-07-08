const fs = require('fs');
const file = '/Users/sharique/Documents/GitHub/FAM-GEN-Portal/src/components/business/report-components/anthropometric-composition.tsx';
let content = fs.readFileSync(file, 'utf8');

// The new component structure
const newContent = `'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ObservationItem } from '@/components/ui/observation-item'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  Ruler,
  Weight,
  BarChart3,
  Eye,
  Plus,
  Scale,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnthropometricCompositionProps {
  data?: any // anthropometricComposition
  title?: string
  subTitle?: string
  onChange?: (data: any) => void
}

export const AnthropometricComposition: React.FC<
  AnthropometricCompositionProps
> = ({
  data,
  title = 'Anthropometric & Body Composition',
  subTitle = 'Tracking your physical transformation and body metrics',
  onChange,
}) => {
  // ── Local editable state, initialized from \`data\` ──────────────────────────
  const [weightChange, setWeightChange] = useState(data?.weightChange || {
    weightStart: 0,
    weightEnd: 0,
    weightUnit: 'kg',
    absoluteChange: 0,
    reductionPercentage: '0',
    description: 'Stay consistent with your healthy habits',
    progress: 'on-track'
  })

  // Ensure we have 4 default metrics
  const defaultMetrics = [
    { name: 'BMI', start: '', end: '', unit: '', status: 'Improved' },
    { name: 'Waist Circumference', start: '', end: '', unit: 'in', status: 'Reduced' },
    { name: 'Ideal Body Weight', start: '', end: '', unit: 'kg', status: 'On Track' },
    { name: 'Waist-Hip Ratio', start: '', end: '', unit: '', status: 'Healthy Range' }
  ]

  const [compositionMetrics, setCompositionMetrics] = useState<any[]>(
    data?.compositionMetrics?.length ? data.compositionMetrics : defaultMetrics
  )

  const [observations, setObservations] = useState<string[]>(
    data?.bodyCompositionObservations && Array.isArray(data.bodyCompositionObservations)
      ? data.bodyCompositionObservations
      : []
  )

  // ── Re-sync when parent passes new data (e.g. after API fetch) ─────────────
  useEffect(() => {
    if (!data) return
    if (data.weightChange) setWeightChange(data.weightChange)
    if (data.compositionMetrics?.length) setCompositionMetrics(data.compositionMetrics)
    if (data.bodyCompositionObservations) setObservations(data.bodyCompositionObservations)
  }, [data])

  // ── Notify parent on any change ────────────────────────────────────────────
  const notify = (patch: Record<string, any>) => {
    onChange?.({
      weightChange,
      compositionMetrics,
      bodyCompositionObservations: observations,
      ...patch,
    })
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || ''
    if (s.includes('normal') || s.includes('improved') || s.includes('reduced') || s.includes('healthy') || s.includes('track') || s.includes('achieved')) {
      return 'bg-[#e8fbf0] text-[#16a34a] border-[#16a34a]/20'
    }
    if (s.includes('over') || s.includes('attention') || s.includes('under') || s.includes('risk')) {
      return 'bg-[#fff7ed] text-[#c2410c] border-[#c2410c]/20'
    }
    if (s.includes('obese') || s.includes('increased') || s.includes('action')) {
      return 'bg-[#fef2f2] text-[#b91c1c] border-[#b91c1c]/20'
    }
    return 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'
  }

  const computedWeightChange =
    (Number(weightChange.weightEnd) || 0) - (Number(weightChange.weightStart) || 0)
  const reductionPct =
    Number(weightChange.weightStart) > 0
      ? (
          ((Number(weightChange.weightStart) - Number(weightChange.weightEnd)) / Number(weightChange.weightStart)) *
          100
        ).toFixed(1)
      : '0.0'

  // ── Observation helpers ────────────────────────────────────────────────────
  const handleAddObservation = () => {
    const next = [...observations, '']
    setObservations(next)
    notify({ bodyCompositionObservations: next })
  }

  const handleUpdateObservation = (index: number, val: string) => {
    const next = [...observations]
    next[index] = val
    setObservations(next)
    notify({ bodyCompositionObservations: next })
  }

  const handleRemoveObservation = (index: number) => {
    const next = observations.filter((_, i) => i !== index)
    setObservations(next)
    notify({ bodyCompositionObservations: next })
  }

  const updateMetric = (index: number, field: string, val: string | number) => {
    const next = [...compositionMetrics]
    next[index] = { ...next[index], [field]: val }
    setCompositionMetrics(next)
    notify({ compositionMetrics: next })
  }

  const updateWeight = (field: string, val: string | number) => {
    const next = { ...weightChange, [field]: val }
    setWeightChange(next)
    notify({ weightChange: next })
  }

  // ── Shared input class ─────────────────────────────────────────────────────
  const inputCls =
    'h-10 text-center text-sm font-medium bg-white border-gray-200 rounded-xl focus:ring-primary/20'

  return (
    <Card className="bg-white border-0 shadow-[0_8px_32px_rgba(15,23,42,0.08)] rounded-[24px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader className="pb-0 pt-8 px-8 flex flex-row items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm shrink-0">
            <BarChart3 className="w-7 h-7 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground mb-0">
              {title}
            </CardTitle>
            <p className="text-gray-400 text-sm font-medium">{subTitle}</p>
          </div>
        </div>
      </CardHeader>

      <div className="p-8 space-y-8 flex flex-col">
        {/* ── Weight Change Card (always editable) ─────────────────────────── */}
        <Card className="w-full p-6 rounded-[24px] border-gray-100 bg-[#f1f7f9] flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[18px] bg-white border-2 border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
              <Scale className="w-8 h-8 text-slate-400" />
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                WEIGHT CHANGE
              </h3>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Before weight */}
                <Input
                  value={weightChange.weightStart}
                  onChange={e => updateWeight("weightStart", e.target.value)}
                  placeholder="Start"
                  className={cn(inputCls, 'w-[80px]')}
                />
                <span className="text-gray-400 text-sm">→</span>
                {/* After weight */}
                <Input
                  value={weightChange.weightEnd}
                  onChange={e => updateWeight("weightEnd", e.target.value)}
                  placeholder="End"
                  className={cn(inputCls, 'w-[80px]')}
                />

                {/* Unit */}
                <Select
                  value={weightChange.weightUnit}
                  onValueChange={v => updateWeight("weightUnit", v)}
                >
                  <SelectTrigger className="w-[70px] h-10 bg-white border-gray-200 rounded-xl text-sm text-gray-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>

                {/* Computed display */}
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-1">
                  <span className="text-lg font-bold text-gray-600">
                    {computedWeightChange >= 0 ? '+' : ''}
                    {computedWeightChange.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">{weightChange.weightUnit}</span>
                </div>
                <span className="text-sm text-gray-500">
                  ({reductionPct}% reduction)
                </span>
              </div>
            </div>
          </div>

          {/* Progress + Description */}
          <div className="flex items-center gap-4 max-w-[80%]">
            <Select
              value={weightChange.progress}
              onValueChange={v => updateWeight("progress", v)}
            >
              <SelectTrigger className="w-[30%] h-12 bg-white border-gray-100 rounded-xl text-gray-400 font-medium">
                <SelectValue placeholder="Select Progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on-track">On Track</SelectItem>
                <SelectItem value="steady">Steady</SelectItem>
                <SelectItem value="slow">Slow</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={weightChange.description}
              onChange={e => updateWeight("description", e.target.value)}
              placeholder="Description"
              className="h-12 bg-white border-gray-100 rounded-xl text-gray-400 font-medium"
            />
          </div>
        </Card>

        {/* ── Metric Cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {compositionMetrics.map((metric, idx) => {
            let Icon = Activity;
            if (metric.name === 'Waist Circumference') Icon = Ruler;
            if (metric.name === 'Ideal Body Weight') Icon = Weight;

            let options = ['Improved', 'Normal Weight', 'Overweight', 'Obese', 'Underweight'];
            if (metric.name === 'Waist Circumference') options = ['Reduced', 'Increased', 'No change', 'Healthy Range', 'Action Needed'];
            if (metric.name === 'Ideal Body Weight') options = ['On Track', 'Needs Attention', 'Goal Achieved'];
            if (metric.name === 'Waist-Hip Ratio') options = ['Healthy Range', 'At Risk', 'Improved'];
            
            return (
              <Card key={idx} className="w-full p-6 rounded-[24px] border-gray-100 flex flex-col items-center text-center gap-4 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 rounded-[10px] bg-slate-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest m-0">
                  {metric.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={metric.start}
                    onChange={e => updateMetric(idx, 'start', e.target.value)}
                    placeholder="-"
                    className={cn(inputCls, 'w-[64px] h-9 font-bold text-[#0f172a] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none')}
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <Input
                    type="number"
                    value={metric.end}
                    onChange={e => updateMetric(idx, 'end', e.target.value)}
                    placeholder="-"
                    className={cn(inputCls, 'w-[64px] h-9 font-black text-[#0f172a] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none')}
                  />
                </div>
                <Select
                  value={metric.status}
                  onValueChange={val => updateMetric(idx, 'status', val)}
                >
                  <SelectTrigger className={cn("h-9 border rounded-xl text-xs font-bold w-full max-w-[140px] mx-auto", getStatusColor(metric.status))}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {metric.name === 'Waist Circumference' && (
                  <p className="text-[11px] font-medium text-gray-400 m-0">Important for metabolic health</p>
                )}
                {metric.name === 'Ideal Body Weight' && (
                  <p className="text-[11px] font-medium text-gray-400 m-0">{weightChange.weightEnd ? \`Current: \${weightChange.weightEnd} \${weightChange.weightUnit}\` : 'Current: N/A'}</p>
                )}
                {metric.name === 'Waist-Hip Ratio' && (
                  <p className="text-[11px] font-medium text-gray-400 m-0">Target: &lt; 0.85 for women</p>
                )}
                {metric.name === 'BMI' && (
                  <div className="h-4" />
                )}
              </Card>
            )
          })}
        </div>

        {/* ── Body Composition Observations ─────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shadow-sm">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-0">
                Body Composition Observations
              </h3>
            </div>

            <Button
              onClick={handleAddObservation}
              className="h-10 px-4 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold uppercase tracking-widest gap-2 shadow-sm transition-all duration-300 transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            {observations.length === 0 && (
              <div className="py-10 px-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                  <Eye className="w-5 h-5 opacity-40 text-blue-500" />
                </div>
                <p className="text-sm font-medium text-slate-400">
                  No body composition observations added for this period still.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {observations.map((obs, i) => (
                <ObservationItem
                  key={i}
                  isEditing={true}
                  text={obs}
                  onTextChange={val => handleUpdateObservation(i, val)}
                  onRemove={() => handleRemoveObservation(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
`

fs.writeFileSync(file, newContent);
