import { Check, X } from 'lucide-react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface ObservationItemProps {
  isEditing?: boolean
  text?: string
  onTextChange?: (val: string) => void
  onRemove?: () => void
  className?: string
  placeholder?: string
}

export const ObservationItem: React.FC<ObservationItemProps> = ({
  isEditing = false,
  text = '',
  onTextChange,
  onRemove,
  className,
  placeholder = 'Placeholder text',
}) => {
  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-5 rounded-[20px] bg-white border border-gray-100 shadow-sm relative transition-all duration-300 hover:shadow-md',
        className
      )}
    >
      {/* Icon Area */}
      <div className="w-8 h-8 bg-[#0f172a] rounded-[8px] flex items-center justify-center shrink-0">
        <Check className="w-4.5 h-4.5 text-white stroke-[3.5]" />
      </div>

      <div className="flex-1 min-w-0 pr-6">
        {isEditing ? (
          <Input
            value={text}
            onChange={e => {
              e.stopPropagation()
              onTextChange?.(e.target.value)
            }}
            placeholder={placeholder}
            autoFocus
            className="w-full h-9 p-0 bg-transparent border-none focus-visible:ring-0 text-[14px] font-medium text-gray-500"
          />
        ) : (
          <p className="text-[14px] font-medium text-gray-600 leading-relaxed">
            {text}
          </p>
        )}
      </div>

      {isEditing && (
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 shadow-sm transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {!isEditing && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 shadow-sm transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
