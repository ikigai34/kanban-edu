'use client';

import React from 'react';
import { ToastMessage, TaskStatus } from '@/types';
import { CheckCircle2, AlertCircle, Clock, Info, X, Send } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  const getStatusIcon = (status?: TaskStatus, type?: string) => {
    if (status === 'done' || type === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (status === 'revision' || type === 'warning' || type === 'error') {
      return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
    }
    if (status === 'on_review') {
      return <Send className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (status === 'in_progress') {
      return <Clock className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
    return <Info className="w-4 h-4 text-sky-600 shrink-0" />;
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white/95 dark:bg-[#1c1c1c]/95 backdrop-blur-md border border-slate-200/90 dark:border-[#2a2a2a] shadow-xl rounded-xl p-3.5 flex items-start gap-3 transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in text-slate-800 dark:text-neutral-100"
        >
          <div className="mt-0.5">
            {getStatusIcon(toast.status, toast.type)}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h5 className="text-xs font-semibold text-slate-900 dark:text-neutral-100 leading-tight">
              {toast.title}
            </h5>
            {toast.description && (
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-snug">
                {toast.description}
              </p>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors shrink-0"
            title="Закрыть"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
