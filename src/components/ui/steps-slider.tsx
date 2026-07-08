'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type StepStatus = 'upcoming' | 'current' | 'complete';

export interface Step {
  id: number;
  name: string;
  status: StepStatus;
}

interface StepsSliderProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (stepId: number) => void;
  className?: string;
}

export function StepsSlider({ steps, currentStep, onStepChange, className }: StepsSliderProps) {
  // Calculate progress percentage based on current step
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <div className="relative flex items-center justify-between w-full">
        {/* Background track */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted transform -translate-y-1/2 z-0"></div>
        
        {/* Progress line */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-primary/90 to-primary transform -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
        
        {/* Steps */}
        {steps.map((step) => (
          <div 
            key={step.id} 
            className="relative z-10 flex flex-col items-center group bg-background min-w-[60px]"
          >
            <button 
              type="button"
              onClick={() => onStepChange(step.id)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                step.status === 'current' && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                step.status === 'complete' && "bg-primary text-primary-foreground",
                step.status === 'upcoming' && "bg-muted text-muted-foreground border-2 border-background"
              )}
            >
              {step.id}
            </button>
            <span className={cn(
              "mt-2 text-xs font-medium transition-colors",
              step.status === 'current' ? "text-primary" : "text-muted-foreground"
            )}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
