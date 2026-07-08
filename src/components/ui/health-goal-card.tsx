import { Check, TrendingUp, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface HealthGoalCardProps {
  index: number
  title: string
  target: string
  range: string
  percentAchieved: number
  status: string
  outcomes: string[]
  onEdit?: () => void
  onRemove?: () => void
}

export const HealthGoalCard: React.FC<HealthGoalCardProps> = ({
  index,
  title,
  target,
  range,
  percentAchieved,
  status,
  outcomes,
  onEdit,
  onRemove,
}) => {
  const isAchieved = status?.toLowerCase() === 'achieved'
  const isOnTrack = status?.toLowerCase() === 'on track'

  return (
    <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 flex flex-col w-full relative">
      {/* Header Row */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-[11px] font-bold text-sky-500 tracking-wider uppercase mb-1">
            GOAL #{index}
          </div>
          <h3 className="text-[20px] font-bold text-[#0f172a] leading-tight">
            {title}
          </h3>
          <p className="text-[14px] text-gray-500 mt-1">Target: {target}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Status Badge */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold',
              isAchieved
                ? 'bg-green-50 text-green-600'
                : isOnTrack
                  ? 'bg-blue-50 text-blue-500'
                  : 'bg-gray-100 text-gray-600'
            )}
          >
            {isAchieved && <Check className="w-4 h-4" />}
            {!isAchieved && isOnTrack && <TrendingUp className="w-4 h-4" />}
            {status}
          </div>

          {/* Edit Button */}
          {onEdit && (
            <Button
              onClick={onEdit}
              size="sm"
              className="h-8 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white flex items-center gap-1.5 font-medium px-3"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          )}

          {/* Remove/Delete Button */}
          {onRemove && (
            <Button
              onClick={onRemove}
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-lg border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar Area */}
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3 overflow-hidden">
        <div
          className="bg-[#0f172a] h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percentAchieved))}%` }}
        />
      </div>

      {/* Progress Metrics */}
      <div className="flex justify-between items-center mb-5">
        <span className="text-[13px] font-medium text-gray-600">{range}</span>
        <span className="text-[13px] font-medium text-gray-500">
          {percentAchieved}% Complete
        </span>
      </div>

      {/* Outcomes List */}
      {outcomes && outcomes.length > 0 && (
        <ul className="space-y-3 pl-2 text-[14px] font-medium text-gray-600 list-disc list-inside marker:text-gray-400">
          {outcomes.map((outcome, i) => (
            <li key={i} className="pl-2">
              {outcome}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
