'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  subText?: string
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  text = 'Loading...',
  subText,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      text: 'text-sm',
      subText: 'text-xs'
    },
    md: {
      container: 'w-12 h-12',
      text: 'text-base',
      subText: 'text-sm'
    },
    lg: {
      container: 'w-16 h-16',
      text: 'text-lg',
      subText: 'text-base'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Spinner */}
      <div className="relative">
        <div className={`${currentSize.container} border-4 border-gray-200 border-t-primary rounded-full animate-spin`}></div>
        <div
          className={`absolute inset-0 ${currentSize.container} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        ></div>
      </div>
      {/* Loading text */}
      <div className="text-center">
        <p className={`text-gray-600 font-medium ${currentSize.text}`}>
          {text}
        </p>
        {subText && (
          <p className={`text-gray-500 mt-1 ${currentSize.subText}`}>
            {subText}
          </p>
        )}
      </div>
    </div>
  )
}
