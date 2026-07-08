import React from 'react'
import { Step } from '@/types/blood-test'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface StepProgressBarProps {
  steps: Step[]
  loading?: boolean
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ steps, loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {Array.from({ length: 4 }).map((_, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center animate-pulse">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
              </div>
              <div className="mt-2 w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            {index < 3 && (
              <div className="flex-1 h-0.5 mx-4 mt-[-24px] bg-gray-200 animate-pulse" />
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between max-w-4xl mx-auto">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step.completed
                  ? 'bg-primary border-primary text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}
            >
              {step.completed ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-sm mt-2 font-medium ${
                step.completed ? 'text-primary' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-4 mt-[-24px] ${
                step.completed ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
