import { Check, X, Pencil } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface ReportItemCardProps {
  isEditing?: boolean
  title?: string
  description?: string
  onSave?: () => void
  onCancel?: () => void
  onEdit?: () => void
  onRemove?: () => void
  onTitleChange?: (val: string) => void
  onDescriptionChange?: (val: string) => void
  placeholder1?: string
  placeholder2?: string
  className?: string
  autoFocus?: boolean
}

export const ReportItemCard: React.FC<ReportItemCardProps> = ({
  isEditing = false,
  title = '',
  description = '',
  onSave,
  onCancel,
  onEdit,
  onRemove,
  onTitleChange,
  onDescriptionChange,
  placeholder1 = 'Win title...',
  placeholder2 = 'Win description...',
  className,
  autoFocus = false,
}) => {
  return (
    <div
      className={cn(
        'group flex items-center gap-6 p-4 rounded-[24px] transition-all duration-300 relative',
        isEditing
          ? 'bg-[#f1f7f9] border border-slate-100 shadow-sm'
          : 'bg-[#f8fafc] hover:bg-slate-100 hover:border-slate-100 shadow-sm hover:shadow-md',
        className
      )}
    >
      {/* View Mode Remove Button (Top Right Absolute) */}
      {!isEditing && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute bg-gray-200 p-1 rounded-full top-[-10px] right-[-10px] text-gray-600 transition-all hover:text-red-500 z-30"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Left Icon Block (Status Indicator) - Only in view mode */}
      {!isEditing && (
        <div
          className={cn(
            'w-10 h-10 bg-[#0f172a] rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-[#1e293b]'
          )}
        >
          <Check className="w-5.5 h-5.5 text-white stroke-[3.5]" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={title || ''}
              onChange={e => {
                e.stopPropagation()
                onTitleChange?.(e.target.value)
              }}
              placeholder={placeholder1}
              autoFocus={autoFocus}
              className="w-full h-10 px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-bold text-[#0f172a]"
            />
            <Input
              value={description || ''}
              onChange={e => {
                e.stopPropagation()
                onDescriptionChange?.(e.target.value)
              }}
              placeholder={placeholder2}
              className="w-full h-10 px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium text-gray-500"
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <h4
              className={cn(
                'text-[17px] font-bold leading-tight text-ellipsis overflow-hidden',
                title ? 'text-[#0f172a]' : 'text-gray-300 italic font-medium'
              )}
            >
              {title || 'Untitled Win'}
            </h4>
            <p
              className={cn(
                'text-[14px] font-medium mt-1 leading-relaxed text-ellipsis overflow-hidden',
                description ? 'text-gray-400' : 'text-gray-300 italic'
              )}
            >
              {description || 'No description shared'}
            </p>
          </div>
        )}
      </div>

      {/* Right Action Block - Vertical in edit mode */}
      <div
        className={cn(
          'shrink-0 flex items-center gap-2',
          isEditing && 'flex-col'
        )}
      >
        {isEditing ? (
          <>
            <Button
              variant="secondary"
              size="icon"
              type="button"
              onClick={onSave}
              className="w-10 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-[10px] transition-all duration-300"
            >
              <Check className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={onCancel}
              className="w-10 h-10 text-gray-400 hover:text-red-500 hover:bg-slate-100 rounded-[10px] transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            size="icon"
            type="button"
            onClick={onEdit}
            className="w-10 h-10 bg-slate-100/50 hover:bg-slate-200 text-gray-400 hover:text-[#0f172a] rounded-[10px] opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
