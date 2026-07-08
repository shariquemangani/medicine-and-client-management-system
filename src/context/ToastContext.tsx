'use client';

import React, { createContext, useContext } from 'react';
import { toast } from 'sonner';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
    const commonOptions = {
      duration,
      className: 'toast-custom',
      closeButton: true,
      style: {
        padding: '14px',
        borderRadius: '8px',
      }
    };
    
    switch (type) {
      case 'success':
        toast.custom((t) => (
          <div className={`flex items-center gap-2 bg-green-50 text-green-800 border border-green-200 shadow-lg rounded-lg p-4 animate-in fade-in-0 zoom-in-95`}>
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
            <button onClick={() => toast.dismiss()} className="ml-auto">
              <X className="h-4 w-4 text-green-600" />
            </button>
          </div>
        ), { ...commonOptions });
        break;
      case 'error':
        toast.custom((t) => (
          <div className={`flex items-center gap-2 bg-red-50 text-red-800 border border-red-200 shadow-lg rounded-lg p-4 animate-in fade-in-0 zoom-in-95`}>
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
            <button onClick={() => toast.dismiss()} className="ml-auto">
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        ), { ...commonOptions });
        break;
      case 'warning':
        toast.custom((t) => (
          <div className={`flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 shadow-lg rounded-lg p-4 animate-in fade-in-0 zoom-in-95`}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
            <button onClick={() => toast.dismiss()} className="ml-auto">
              <X className="h-4 w-4 text-amber-600" />
            </button>
          </div>
        ), { ...commonOptions });
        break;
      case 'info':
      default:
        toast.custom((t) => (
          <div className={`flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-200 shadow-lg rounded-lg p-4 animate-in fade-in-0 zoom-in-95`}>
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
            <button onClick={() => toast.dismiss()} className="ml-auto">
              <X className="h-4 w-4 text-blue-600" />
            </button>
          </div>
        ), { ...commonOptions });
        break;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};